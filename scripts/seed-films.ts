import { fetchPopularMovies, fetchMovieDetails, fetchMovieCredits, filterCredits } from '../src/lib/tmdb';
import { supabaseAdmin } from '../src/lib/supabase';

async function seedFilms(targetCount = 100) {
  console.log(`Starting film seed script... target: ${targetCount} films`);

  let fetchedFilms = 0;
  let page = 1;

  while (fetchedFilms < targetCount && page <= 10) {
    console.log(`Fetching popular movies page ${page}...`);
    try {
      const movies = await fetchPopularMovies(page);
      page++;

      for (const movie of movies) {
        if (fetchedFilms >= targetCount) break;

        try {
          console.log(`[${fetchedFilms + 1}/${targetCount}] Processing film: ${movie.title} (ID: ${movie.id})`);
          
          const [details, credits] = await Promise.all([
            fetchMovieDetails(movie.id),
            fetchMovieCredits(movie.id),
          ]);

          const filteredCredits = filterCredits(credits.cast, credits.crew);
          const year = details.release_date
            ? parseInt(details.release_date.split('-')[0], 10)
            : null;

          const filmRow = {
            tmdb_id: details.id,
            title: details.title,
            year,
            poster_path: details.poster_path,
            cast_crew: filteredCredits,
            fetched_at: new Date().toISOString(),
          };

          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { error } = await supabaseAdmin.from('films').upsert(filmRow);
            if (error) {
              console.warn(`Supabase upsert error for ${movie.title}:`, error.message);
            }
          } else {
            console.log(`  -> Cached locally / Dry run for: ${movie.title}`);
          }

          fetchedFilms++;
          // Rate limit friendliness
          await new Promise((r) => setTimeout(r, 150));
        } catch (err) {
          console.error(`Error processing film ${movie.id}:`, err);
        }
      }
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err);
      break;
    }
  }

  console.log(`Seeding finished. Added ${fetchedFilms} films.`);
}

seedFilms().catch(console.error);
