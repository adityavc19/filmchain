import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchPersonMovieCredits, fetchPersonTvCredits, fetchPersonDetails, TmdbFilm, TmdbPersonDetails } from '@/lib/tmdb';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const personId = parseInt(id, 10);
    if (isNaN(personId)) {
      return NextResponse.json({ error: 'Invalid person ID' }, { status: 400 });
    }

    // Check cached person in Supabase
    const { data: person } = await supabaseAdmin
      .from('people')
      .select('tmdb_id, name, profile_path, filmography, tv_credits, biography, known_for, birthday, place_of_birth, fetched_at')
      .eq('tmdb_id', personId)
      .single();

    const now = Date.now();
    if (
      person &&
      person.fetched_at &&
      person.name &&
      person.name !== 'Unknown' &&
      person.name !== 'Person' &&
      person.name !== 'Unknown Person' &&
      person.filmography &&
      Array.isArray(person.filmography) &&
      person.filmography.length > 0 &&
      person.tv_credits &&
      Array.isArray(person.tv_credits) &&
      now - new Date(person.fetched_at).getTime() < SEVEN_DAYS_MS
    ) {
      return NextResponse.json({
        tmdb_id: person.tmdb_id,
        name: person.name,
        profile_path: person.profile_path,
        filmography: person.filmography,
        tv_credits: person.tv_credits,
        biography: person.biography || null,
        known_for: person.known_for || null,
        birthday: person.birthday || null,
        place_of_birth: person.place_of_birth || null,
      });
    }

    // Fetch movies, TV shows, and person details concurrently
    const [movieCredits, tvCredits, personDetails] = await Promise.all([
      fetchPersonMovieCredits(personId).catch(() => ({ cast: [], crew: [] })),
      fetchPersonTvCredits(personId).catch(() => ({ cast: [], crew: [] })),
      fetchPersonDetails(personId).catch(() => ({ id: personId, name: '', profile_path: null } as TmdbPersonDetails)),
    ]);

    // 1. Build Movie Filmography
    const movieMap = new Map<number, TmdbFilm>();
    const allMovieCredits = [...(movieCredits.cast || []), ...(movieCredits.crew || [])];

    for (const film of allMovieCredits) {
      if (film && film.id && film.title) {
        if (!movieMap.has(film.id)) {
          movieMap.set(film.id, {
            id: film.id,
            title: film.title,
            release_date: film.release_date || '',
            poster_path: film.poster_path || null,
            vote_count: film.vote_count || 0,
            popularity: film.popularity || 0,
            character: film.character,
            media_type: 'movie',
          });
        }
      }
    }

    const filmography = Array.from(movieMap.values()).sort((a, b) => {
      if (b.release_date && a.release_date) {
        return b.release_date.localeCompare(a.release_date);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

    // 2. Build TV Credits
    const tvMap = new Map<number, TmdbFilm>();
    const allTvCredits = [...(tvCredits.cast || []), ...(tvCredits.crew || [])];

    for (const tv of allTvCredits) {
      const tvTitle = tv.name || tv.original_name || tv.title;
      if (tv && tv.id && tvTitle) {
        if (!tvMap.has(tv.id)) {
          tvMap.set(tv.id, {
            id: tv.id,
            title: tvTitle,
            release_date: tv.first_air_date || tv.release_date || '',
            poster_path: tv.poster_path || null,
            vote_count: tv.vote_count || 0,
            popularity: tv.popularity || 0,
            character: tv.character,
            media_type: 'tv',
            episode_count: tv.episode_count,
          });
        }
      }
    }

    const tvList = Array.from(tvMap.values()).sort((a, b) => {
      if (b.release_date && a.release_date) {
        return b.release_date.localeCompare(a.release_date);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });

    const newPerson = {
      tmdb_id: personId,
      name: personDetails.name || (person?.name && person.name !== 'Unknown' && person.name !== 'Person' ? person.name : 'Unknown Person'),
      profile_path: personDetails.profile_path || person?.profile_path || null,
      filmography,
      tv_credits: tvList,
      biography: personDetails.biography || null,
      known_for: personDetails.known_for_department || null,
      birthday: personDetails.birthday || null,
      place_of_birth: personDetails.place_of_birth || null,
      fetched_at: new Date().toISOString(),
    };

    await supabaseAdmin.from('people').upsert(newPerson);

    return NextResponse.json({
      tmdb_id: newPerson.tmdb_id,
      name: newPerson.name,
      profile_path: newPerson.profile_path,
      filmography: newPerson.filmography,
      tv_credits: newPerson.tv_credits,
      biography: newPerson.biography,
      known_for: newPerson.known_for,
      birthday: newPerson.birthday,
      place_of_birth: newPerson.place_of_birth,
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
