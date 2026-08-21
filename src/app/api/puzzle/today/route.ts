import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMovieDetails } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's puzzle
    const { data: puzzle, error: puzzleError } = await supabaseAdmin
      .from('daily_puzzles')
      .select('date, start_film_id, end_film_id, min_hops')
      .eq('date', today)
      .single();

    if (puzzleError || !puzzle) {
      return NextResponse.json({ error: 'No puzzle for today' }, { status: 404 });
    }

    // Fetch both start and end film details from Supabase or TMDb
    let [startFilmRes, endFilmRes] = await Promise.all([
      supabaseAdmin.from('films').select('tmdb_id, title, year, poster_path').eq('tmdb_id', puzzle.start_film_id).single(),
      supabaseAdmin.from('films').select('tmdb_id, title, year, poster_path').eq('tmdb_id', puzzle.end_film_id).single(),
    ]);

    let startFilm = startFilmRes.data;
    let endFilm = endFilmRes.data;

    // Fallback if film details not in DB
    if (!startFilm) {
      const details = await fetchMovieDetails(puzzle.start_film_id);
      startFilm = {
        tmdb_id: details.id,
        title: details.title,
        year: details.release_date ? parseInt(details.release_date.split('-')[0]) : null,
        poster_path: details.poster_path,
      };
    }

    if (!endFilm) {
      const details = await fetchMovieDetails(puzzle.end_film_id);
      endFilm = {
        tmdb_id: details.id,
        title: details.title,
        year: details.release_date ? parseInt(details.release_date.split('-')[0]) : null,
        poster_path: details.poster_path,
      };
    }

    // Count today's players
    const { count: playerCount } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('*', { count: 'exact', head: true })
      .eq('puzzle_date', today);

    return NextResponse.json({
      date: puzzle.date,
      startFilm,
      endFilm,
      endFilmId: puzzle.end_film_id,
      minHops: puzzle.min_hops,
      playerCount: playerCount || 0,
    });
  } catch (error) {
    console.error('Error fetching today puzzle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
