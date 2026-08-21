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

  if (error) throw error;
  return data || newFilm;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    if (!startStr || !endStr) {
      return NextResponse.json({ error: 'Missing start or end params' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('Error fetching custom puzzle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
