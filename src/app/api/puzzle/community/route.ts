import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMovieDetails } from '@/lib/tmdb';

export async function GET() {
  try {
    const { data: puzzles, error } = await supabaseAdmin
      .from('custom_puzzles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Error fetching community puzzles:', error);
      return NextResponse.json({ puzzles: [] });
    }

    const populated = await Promise.all(
      (puzzles || []).map(async (p) => {
        try {
          const [sMovie, tMovie] = await Promise.all([
            fetchMovieDetails(p.start_film_id).catch(() => null),
            fetchMovieDetails(p.end_film_id).catch(() => null),
          ]);
          return {
            ...p,
            startFilm: sMovie ? {
              tmdb_id: sMovie.id,
              title: sMovie.title,
              year: sMovie.release_date ? parseInt(sMovie.release_date.split('-')[0]) : null,
              poster_path: sMovie.poster_path,
            } : null,
            endFilm: tMovie ? {
              tmdb_id: tMovie.id,
              title: tMovie.title,
              year: tMovie.release_date ? parseInt(tMovie.release_date.split('-')[0]) : null,
              poster_path: tMovie.poster_path,
            } : null,
          };
        } catch (e) {
          return p;
        }
      })
    );

    return NextResponse.json({ puzzles: populated });
  } catch (err) {
    console.error('Community puzzles error:', err);
    return NextResponse.json({ puzzles: [] });
  }
}
