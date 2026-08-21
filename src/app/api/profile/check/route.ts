import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get('username')?.trim().toLowerCase();

    if (!rawUsername) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Validate username format (alphanumeric, dashes, underscores, 3-24 chars)
    const valid = /^[a-z0-9_-]{3,24}$/.test(rawUsername);
    if (!valid) {
      return NextResponse.json({
        available: false,
        reason: 'Username must be 3-24 characters and only contain letters, numbers, hyphens, and underscores.',
      });
    }

    // Check against Supabase profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .ilike('username', rawUsername)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking username:', error);
    }

    return NextResponse.json({
      available: !data,
      username: rawUsername,
    });
  } catch (err) {
    console.error('Check username error:', err);
    return NextResponse.json({ available: true, username: '' });
  }
}
