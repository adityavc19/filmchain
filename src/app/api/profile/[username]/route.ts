import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchMovieDetails, posterUrl } from '@/lib/tmdb';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: rawUsername } = await params;
    const username = decodeURIComponent(rawUsername).trim();

    // 1. Fetch or initialize profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (!profile) {
      // Return a virtual profile structure if not yet explicitly saved
      profile = {
        username,
        display_name: username,
        bio: '',
        created_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
      };
    }

    // 2. Fetch user's leaderboard solve history (both daily and custom)
    const { data: solves } = await supabaseAdmin
      .from('leaderboard_entries')
      .select('*')
      .eq('handle', username)
      .order('submitted_at', { ascending: false });

    const totalSolves = (solves || []).length;
    let bestTime = totalSolves > 0 ? Math.min(...(solves || []).map(s => s.time_seconds)) : null;
    let fewestClicks = totalSolves > 0 ? Math.min(...(solves || []).map(s => (s.path?.length ? s.path.length - 1 : s.hop_count * 2))) : null;

    // 3. Fetch custom puzzles created by this user
    const { data: createdPuzzles } = await supabaseAdmin
      .from('custom_puzzles')
      .select('*')
      .eq('creator_handle', username)
      .order('created_at', { ascending: false });

    // Populate start & target film details for each created puzzle
    const populatedPuzzles = await Promise.all(
      (createdPuzzles || []).map(async (p) => {
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

    return NextResponse.json({
      profile,
      stats: {
        totalSolves,
        bestTime,
        fewestClicks,
        totalCreated: (createdPuzzles || []).length,
      },
      recentSolves: (solves || []).slice(0, 10),
      createdPuzzles: populatedPuzzles,
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username: targetUsername } = await params;
    const body = await req.json();
    const { newUsername, bio, display_name } = body;

    const usernameToSave = (newUsername || targetUsername).trim().toLowerCase();

    // Check if newUsername is already taken by someone else
    if (newUsername && newUsername.toLowerCase() !== targetUsername.toLowerCase()) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .ilike('username', newUsername)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }

      // If user had an existing profile and is renaming, update handle across tables
      if (targetUsername) {
        await supabaseAdmin
          .from('leaderboard_entries')
          .update({ handle: usernameToSave })
          .eq('handle', targetUsername);

        await supabaseAdmin
          .from('custom_puzzles')
          .update({ creator_handle: usernameToSave })
          .eq('creator_handle', targetUsername);
      }
    }

    const payload = {
      username: usernameToSave,
      display_name: display_name || usernameToSave,
      bio: bio || '',
      last_active_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
