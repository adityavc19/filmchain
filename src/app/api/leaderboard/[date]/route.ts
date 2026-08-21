import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  try {
    const { date } = await params;
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD.' }, { status: 400 });
    }

    const { data: entries, error } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('*')
      .eq('puzzle_date', date)
      .order('time_seconds', { ascending: true })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error) {
    console.error('Error fetching leaderboard entries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
