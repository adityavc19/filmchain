import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMovieDetails, filterCredits, fetchMovieCredits } from '@/lib/tmdb';

async function getOrFetchFilm(tmdbId: number) {
  const { data: film } = await supabaseAdmin
    .from('films')
    .select('*')
    .eq('tmdb_id', tmdbId)
    .single();

  if (film) {
    return film;
  }

  const [details, credits] = await Promise.all([
    fetchMovieDetails(tmdbId),
    fetchMovieCredits(tmdbId),
  ]);
  const filteredCredits = filterCredits(credits.cast, credits.crew);

  const year = details.release_date
    ? parseInt(details.release_date.split('-')[0], 10)
    : null;

  const newFilm = {
    tmdb_id: details.id,
    title: details.title,
    year,
    poster_path: details.poster_path,
    cast_crew: filteredCredits,
    fetched_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from('films')
    .upsert(newFilm)
    .select()
    .single();

  if (error) {
    console.warn('Upsert film error:', error);
  }
  return data || newFilm;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    if (id) {
      // Lookup custom puzzle by UUID
      const { data: puzzle, error } = await supabaseAdmin
        .from('custom_puzzles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !puzzle) {
        return NextResponse.json({ error: 'Custom puzzle not found' }, { status: 404 });
      }

      const [startFilm, endFilm, leaderRes] = await Promise.all([
        getOrFetchFilm(puzzle.start_film_id),
        getOrFetchFilm(puzzle.end_film_id),
        supabaseAdmin
          .from('custom_leaderboard_entries')
          .select('*')
          .eq('puzzle_id', id)
          .order('time_seconds', { ascending: true })
          .limit(20),
      ]);

      return NextResponse.json({
        id: puzzle.id,
        creator_handle: puzzle.creator_handle,
        title: puzzle.title,
        play_count: puzzle.play_count || 0,
        startFilm: {
          tmdb_id: startFilm.tmdb_id,
          title: startFilm.title,
          year: startFilm.year,
          poster_path: startFilm.poster_path,
        },
        endFilm: {
          tmdb_id: endFilm.tmdb_id,
          title: endFilm.title,
          year: endFilm.year,
          poster_path: endFilm.poster_path,
        },
        leaderboard: leaderRes.data || [],
      });
    }

    if (startStr && endStr) {
      const startId = parseInt(startStr, 10);
      const endId = parseInt(endStr, 10);

      if (isNaN(startId) || isNaN(endId)) {
        return NextResponse.json({ error: 'Invalid start or end params' }, { status: 400 });
      }

      const [startFilm, endFilm] = await Promise.all([
        getOrFetchFilm(startId),
        getOrFetchFilm(endId),
      ]);

      return NextResponse.json({
        startFilm: {
          tmdb_id: startFilm.tmdb_id,
          title: startFilm.title,
          year: startFilm.year,
          poster_path: startFilm.poster_path,
        },
        endFilm: {
          tmdb_id: endFilm.tmdb_id,
          title: endFilm.title,
          year: endFilm.year,
          poster_path: endFilm.poster_path,
        },
      });
    }

    return NextResponse.json({ error: 'Provide either id or start and end parameters' }, { status: 400 });
  } catch (err) {
    console.error('Error in custom puzzle GET:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { startFilmId, endFilmId, creatorHandle, title } = body;

    if (!startFilmId || !endFilmId) {
      return NextResponse.json({ error: 'startFilmId and endFilmId are required' }, { status: 400 });
    }

    if (startFilmId === endFilmId) {
      return NextResponse.json({ error: 'Start and Target film cannot be the same' }, { status: 400 });
    }

    // Ensure both films are fetched and cached in database
    const [startFilm, endFilm] = await Promise.all([
      getOrFetchFilm(startFilmId),
      getOrFetchFilm(endFilmId),
    ]);

    // Insert into custom_puzzles
    const puzzleTitle = title || `${startFilm.title} → ${endFilm.title}`;
    const { data: puzzle, error } = await supabaseAdmin
      .from('custom_puzzles')
      .insert({
        creator_handle: creatorHandle || null,
        start_film_id: startFilmId,
        end_film_id: endFilmId,
        title: puzzleTitle,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create custom puzzle:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: puzzle.id,
      title: puzzle.title,
      creator_handle: puzzle.creator_handle,
      startFilm: {
        tmdb_id: startFilm.tmdb_id,
        title: startFilm.title,
        year: startFilm.year,
        poster_path: startFilm.poster_path,
      },
      endFilm: {
        tmdb_id: endFilm.tmdb_id,
        title: endFilm.title,
        year: endFilm.year,
        poster_path: endFilm.poster_path,
      },
    });
  } catch (err) {
    console.error('Error creating custom puzzle:', err);
    return NextResponse.json({ error: 'Failed to create custom puzzle' }, { status: 500 });
  }
}
