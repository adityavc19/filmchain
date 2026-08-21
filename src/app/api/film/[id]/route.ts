import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMovieDetails, fetchMovieCredits, fetchTvDetails, fetchTvCredits, filterCredits, TmdbHttpError } from '@/lib/tmdb';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tmdbId = parseInt(id, 10);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: 'Invalid film ID' }, { status: 400 });
    }

    const { data: film } = await supabaseAdmin
      .from('films')
      .select('tmdb_id, title, year, poster_path, cast_crew, overview, tagline, runtime, genres, vote_average, fetched_at')
      .eq('tmdb_id', tmdbId)
      .single();

    const now = Date.now();
    if (
      film &&
      film.fetched_at &&
      film.title &&
      film.overview &&
      film.cast_crew &&
      Array.isArray(film.cast_crew) &&
      film.cast_crew.length > 0 &&
      (now - new Date(film.fetched_at).getTime() < SEVEN_DAYS_MS)
    ) {
      return NextResponse.json({
        tmdb_id: film.tmdb_id,
        title: film.title,
        year: film.year,
        poster_path: film.poster_path,
        cast_crew: film.cast_crew,
        overview: film.overview,
        tagline: film.tagline,
        runtime: film.runtime,
        genres: film.genres || [],
        vote_average: film.vote_average,
      });
    }

    let details: any = null;
    let credits: { cast: any[]; crew: any[] } = { cast: [], crew: [] };

    // Try movie first
    try {
      [details, credits] = await Promise.all([
        fetchMovieDetails(tmdbId),
        fetchMovieCredits(tmdbId),
      ]);
    } catch (movieErr: any) {
      // If movie returns 404, try TV show
      if (movieErr instanceof TmdbHttpError && movieErr.status === 404) {
        try {
          [details, credits] = await Promise.all([
            fetchTvDetails(tmdbId),
            fetchTvCredits(tmdbId),
          ]);
        } catch (tvErr) {
          console.error(`Failed to find media ${tmdbId} as Movie or TV:`, tvErr);
          return NextResponse.json({ error: 'Media not found' }, { status: 404 });
        }
      } else {
        throw movieErr;
      }
    }

    if (!details) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const filteredCredits = filterCredits(credits.cast || [], credits.crew || []);
    const year = details.release_date
      ? parseInt(details.release_date.split('-')[0], 10)
      : null;

    const newFilm = {
      tmdb_id: details.id,
      title: details.title,
      year,
      poster_path: details.poster_path,
      cast_crew: filteredCredits,
      overview: details.overview || 'No synopsis available.',
      tagline: details.tagline || null,
      runtime: details.runtime || null,
      genres: details.genres || [],
      vote_average: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : null,
      fetched_at: new Date().toISOString(),
    };

    await supabaseAdmin.from('films').upsert(newFilm);

    return NextResponse.json({
      tmdb_id: newFilm.tmdb_id,
      title: newFilm.title,
      year: newFilm.year,
      poster_path: newFilm.poster_path,
      cast_crew: newFilm.cast_crew,
      overview: newFilm.overview,
      tagline: newFilm.tagline,
      runtime: newFilm.runtime,
      genres: newFilm.genres,
      vote_average: newFilm.vote_average,
    });
  } catch (error) {
    console.error('Error fetching film:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
