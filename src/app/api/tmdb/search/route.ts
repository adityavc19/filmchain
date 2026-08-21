import { NextRequest, NextResponse } from 'next/server';
import { searchMovies } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchMovies(query);
    // Return top 8 matches formatted
    const formatted = results.slice(0, 8).map(m => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? parseInt(m.release_date.split('-')[0]) : null,
      poster_path: m.poster_path,
      vote_count: m.vote_count,
    }));

    return NextResponse.json({ results: formatted });
  } catch (err) {
    console.error('TMDb search API error:', err);
    return NextResponse.json({ results: [] });
  }
}
