import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, PathStep } from '@/lib/supabase';
import { validatePath } from '@/lib/graph';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { puzzle_date, handle, time_seconds, hop_count, path } = body;

    if (time_seconds < 30) {
      return NextResponse.json({ error: 'Time excessively fast. Anti-cheat triggered.' }, { status: 400 });
    }

    if (!path || !Array.isArray(path) || path.length < 3) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (path[0].type !== 'film' || path[path.length - 1].type !== 'film') {
      return NextResponse.json({ error: 'Path must start and end with a film' }, { status: 400 });
    }

    for (let i = 0; i < path.length; i++) {
      const expectedType = i % 2 === 0 ? 'film' : 'person';
      if (path[i].type !== expectedType) {
        return NextResponse.json({ error: 'Path must alternate between film and person' }, { status: 400 });
      }
    }

    const { valid, error: pathError } = await validatePath(path as PathStep[]);
    if (!valid) {
      return NextResponse.json({ error: pathError || 'Path validation failed' }, { status: 400 });
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('leaderboard_entries')
      .insert({
        puzzle_date,
        handle,
        time_seconds,
        hop_count,
        path
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const { count: rank, error: rankError } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('*', { count: 'exact', head: true })
      .eq('puzzle_date', puzzle_date)
      .lt('time_seconds', time_seconds);

    return NextResponse.json({ id: inserted.id, rank: (rank || 0) + 1 });
  } catch (error) {
    console.error('Error posting to leaderboard:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
