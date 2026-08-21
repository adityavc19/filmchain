import { fetchPopularMovies, fetchMovieDetails, fetchMovieCredits, filterCredits, TmdbFilmCredit } from '../src/lib/tmdb';
import { supabaseAdmin } from '../src/lib/supabase';
import { bfsShortestPath } from '../src/lib/graph';

interface FilmRecord {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  cast_crew: TmdbFilmCredit[];
  fetched_at: string;
}

async function curatePuzzles(days = 14) {
  console.log(`Starting daily puzzle curation for ${days} days...`);

  let films: FilmRecord[] = [];

  // Try fetching from Supabase first
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Fetching films from Supabase...');
    const { data, error } = await supabaseAdmin.from('films').select('*');
    if (!error && data && data.length >= 20) {
      films = data as FilmRecord[];
    }
  }

  // Fallback: fetch directly from TMDb if database isn't populated yet
  if (films.length < 20) {
    console.log('Fetching candidate pool from TMDb directly...');
    const topMovies = await fetchPopularMovies(1);
    const movieDetailsList = await Promise.all(
      topMovies.slice(0, 25).map(async (m) => {
        try {
          const [details, credits] = await Promise.all([
            fetchMovieDetails(m.id),
            fetchMovieCredits(m.id),
          ]);
          const year = details.release_date ? parseInt(details.release_date.split('-')[0], 10) : null;
          const record: FilmRecord = {
            tmdb_id: details.id,
            title: details.title,
            year,
            poster_path: details.poster_path,
            cast_crew: filterCredits(credits.cast, credits.crew),
            fetched_at: new Date().toISOString(),
          };

          // Save to films table in Supabase
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            await supabaseAdmin.from('films').upsert(record);
          }
          return record;
        } catch (e) {
          console.warn('Error fetching film', m.id, e);
          return null;
        }
      })
    );
    films = movieDetailsList.filter((f): f is FilmRecord => f !== null);
  }

  console.log(`Loaded pool of ${films.length} films.`);

  // Build in-memory bipartite graph
  const graph = new Map<string, Set<string>>();

  const addEdge = (nodeA: string, nodeB: string) => {
    if (!graph.has(nodeA)) graph.set(nodeA, new Set());
    if (!graph.has(nodeB)) graph.set(nodeB, new Set());
    graph.get(nodeA)!.add(nodeB);
    graph.get(nodeB)!.add(nodeA);
  };

  for (const film of films) {
    const filmNode = `film:${film.tmdb_id}`;
    for (const member of film.cast_crew) {
      const personNode = `person:${member.id}`;
      addEdge(filmNode, personNode);
    }
  }

  console.log(`Graph built with ${graph.size} nodes.`);

  // Find candidate 2-5 hop pairs
  const validPairs: { start: FilmRecord; end: FilmRecord; hops: number }[] = [];

  for (let i = 0; i < films.length; i++) {
    for (let j = i + 1; j < films.length; j++) {
      const start = films[i];
      const end = films[j];

      const hops = bfsShortestPath(graph, start.tmdb_id, end.tmdb_id);
      if (hops >= 2 && hops <= 6) {
        validPairs.push({ start, end, hops });
      }
    }
  }

  console.log(`Found ${validPairs.length} candidate puzzle pairs.`);

  // Shuffle pairs
  const shuffled = validPairs.sort(() => 0.5 - Math.random());

  // Generate daily puzzle entries starting from today
  const today = new Date();

  for (let d = 0; d < Math.min(days, shuffled.length); d++) {
    const puzzleDate = new Date(today);
    puzzleDate.setDate(today.getDate() + d);
    const dateStr = puzzleDate.toISOString().split('T')[0];

    const pair = shuffled[d];
    console.log(`[Puzzle ${d + 1}] ${dateStr} | Start: "${pair.start.title}" -> Target: "${pair.end.title}" (${pair.hops} hops)`);

    // Ensure start and end films are saved in Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await supabaseAdmin.from('films').upsert(pair.start);
      await supabaseAdmin.from('films').upsert(pair.end);

      const puzzleRow = {
        date: dateStr,
        start_film_id: pair.start.tmdb_id,
        end_film_id: pair.end.tmdb_id,
        min_hops: pair.hops,
      };

      const { error } = await supabaseAdmin.from('daily_puzzles').upsert(puzzleRow);
      if (error) {
        console.warn(`Error inserting puzzle for ${dateStr}:`, error.message);
      }
    }
  }

  console.log('Puzzle curation completed successfully.');
}

curatePuzzles().catch(console.error);
