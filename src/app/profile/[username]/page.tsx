'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { posterUrl } from '@/lib/tmdb';
import { getOrCreateHandle } from '@/lib/handle';

interface ProfileData {
  profile: {
    username: string;
    display_name?: string | null;
    bio?: string | null;
    created_at: string;
    last_active_at: string;
  };
  stats: {
    totalSolves: number;
    bestTime: number | null;
    fewestClicks: number | null;
    totalCreated: number;
  };
  recentSolves: Array<{
    id: string;
    puzzle_date: string;
    time_seconds: number;
    hop_count: number;
    path: Array<{ type: string; id: number; name: string }>;
    submitted_at: string;
  }>;
  createdPuzzles: Array<{
    id: string;
    title?: string;
    play_count: number;
    created_at: string;
    startFilm?: {
      tmdb_id: number;
      title: string;
      year: number | null;
      poster_path: string | null;
    };
    endFilm?: {
      tmdb_id: number;
      title: string;
      year: number | null;
      poster_path: string | null;
    };
  }>;
}

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [activeHandle, setActiveHandle] = useState('');
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState<{ checked: boolean; available: boolean; msg?: string }>({
    checked: false,
    available: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isOwner = activeHandle.toLowerCase() === decodeURIComponent(username).toLowerCase();

  useEffect(() => {
    setActiveHandle(getOrCreateHandle());
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/${username}`);
        const json = await res.json();
        if (res.ok) {
          setData(json);
          setBio(json.profile.bio || '');
          setNewUsername(json.profile.username || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  // Check username availability when typing in edit modal
  useEffect(() => {
    if (!newUsername || newUsername.toLowerCase() === decodeURIComponent(username).toLowerCase()) {
      setAvailability({ checked: true, available: true });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/profile/check?username=${encodeURIComponent(newUsername)}`);
        const json = await res.json();
        setAvailability({
          checked: true,
          available: json.available,
          msg: json.reason || (json.available ? 'Username available!' : 'Username is already taken'),
        });
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newUsername, username]);

  async function handleSaveProfile() {
    if (!availability.available) return;
    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch(`/api/profile/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: newUsername.trim().toLowerCase(),
          bio: bio.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setSaveError(json.error || 'Failed to update profile');
      } else {
        // Update local handle and redirect if renamed
        const finalHandle = json.profile.username;
        localStorage.setItem('filmtrace-handle', finalHandle);
        setActiveHandle(finalHandle);
        setIsEditing(false);
        if (finalHandle !== username) {
          window.location.href = `/profile/${finalHandle}`;
        } else {
          setData(prev => prev ? { ...prev, profile: json.profile } : null);
        }
      }
    } catch (err) {
      console.error(err);
      setSaveError('Network error saving profile');
    } finally {
      setIsSaving(false);
    }
  }

  function copyPuzzleLink(id: string) {
    const url = `${window.location.origin}/game/custom/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Profile...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
        <Link href="/" className="text-xs text-accent hover:underline">← Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-4 text-left">
      {/* Profile Header Banner */}
      <div className="bg-bg-card border border-border p-6 sm:p-8 rounded-[4px] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00e054] via-[#ff8000] to-[#40bcf4] flex items-center justify-center text-2xl sm:text-3xl font-black text-bg-primary shadow-lg flex-shrink-0">
            {data.profile.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                @{data.profile.username}
              </h1>
              {isOwner && (
                <span className="text-[10px] uppercase font-bold bg-accent/15 text-accent px-2 py-0.5 rounded border border-accent/30 font-mono">
                  You
                </span>
              )}
            </div>

            {data.profile.bio && (
              <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 max-w-md">
                {data.profile.bio}
              </p>
            )}

            <span className="text-[11px] text-text-muted mt-1">
              Member since {new Date(data.profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Owner Controls */}
        {isOwner && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 sm:flex-initial px-4 py-2 bg-bg-secondary hover:bg-bg-hover text-white text-xs font-bold border border-border rounded transition-colors cursor-pointer text-center"
            >
              Edit Username
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-bg-card border border-border p-4 rounded-[4px] text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Total Solves</span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-white mt-1 block">
            {data.stats.totalSolves}
          </span>
        </div>

        <div className="bg-bg-card border border-border p-4 rounded-[4px] text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Best Time</span>
          <span className="font-mono text-2xl sm:text-3xl font-bold text-accent mt-1 block">
            {data.stats.bestTime !== null ? (
              `${Math.floor(data.stats.bestTime / 60)}:${String(data.stats.bestTime % 60).padStart(2, '0')}`
            ) : '—'}
          </span>
        </div>

        <div className="bg-bg-card border border-border p-4 rounded-[4px] text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Fewest Clicks</span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-white mt-1 block">
            {data.stats.fewestClicks !== null ? data.stats.fewestClicks : '—'}
          </span>
        </div>

        <div className="bg-bg-card border border-border p-4 rounded-[4px] text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">Created Games</span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-[#40bcf4] mt-1 block">
            {data.stats.totalCreated}
          </span>
        </div>
      </div>

      {/* Community Puzzles Created By This User */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-white">
            Created Games ({data.createdPuzzles.length})
          </h2>
          {isOwner && (
            <Link
              href="/create"
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-xs uppercase tracking-wider rounded-[4px] transition-all cursor-pointer shadow-md"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Create Game</span>
            </Link>
          )}
        </div>

        {data.createdPuzzles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.createdPuzzles.map((p) => (
              <div key={p.id} className="bg-bg-card border border-border p-4 rounded-[4px] flex flex-col gap-3 justify-between shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-16 relative rounded overflow-hidden bg-bg-secondary border border-border flex-shrink-0">
                      {p.startFilm?.poster_path ? (
                        <Image src={posterUrl(p.startFilm.poster_path, 'w92')} alt={p.startFilm.title} fill className="object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                    </div>
                    <span className="text-xs font-light text-accent">➔</span>
                    <div className="w-11 h-16 relative rounded overflow-hidden bg-bg-secondary border-2 border-accent flex-shrink-0">
                      {p.endFilm?.poster_path ? (
                        <Image src={posterUrl(p.endFilm.poster_path, 'w92')} alt={p.endFilm.title} fill className="object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">
                        {p.title || `${p.startFilm?.title} → ${p.endFilm?.title}`}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        {p.play_count} solves
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <Link
                    href={`/game/custom/${p.id}`}
                    className="flex-1 py-1.5 bg-accent text-bg-primary text-[11px] font-bold uppercase tracking-wider rounded text-center hover:bg-accent-dim transition-colors"
                  >
                    Play Puzzle &rarr;
                  </Link>
                  <button
                    onClick={() => copyPuzzleLink(p.id)}
                    className="px-3 py-1.5 bg-bg-secondary border border-border text-text-secondary hover:text-white text-[11px] font-semibold rounded transition-colors cursor-pointer"
                  >
                    {copiedId === p.id ? '✓ Copied' : 'Share'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-bg-card border border-border p-8 rounded-[4px] text-center flex flex-col items-center justify-center gap-3">
            <span className="text-3xl">🎬</span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-white">No created games yet</span>
              <p className="text-xs text-text-secondary max-w-sm">
                Connect any two films through cast and crew to challenge other cinephiles.
              </p>
            </div>
            {isOwner && (
              <Link
                href="/create"
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-xs uppercase tracking-wider rounded-[4px] transition-all cursor-pointer shadow-md"
              >
                <span>+ Create Your First Game</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Recent Solves History */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-bold uppercase tracking-wider text-white">
            Recent Solves ({data.recentSolves.length})
          </h2>
        </div>

        {data.recentSolves.length > 0 ? (
          <div className="bg-bg-card border border-border rounded-[4px] overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-text-secondary bg-bg-secondary/50">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Trail</th>
                  <th className="py-2.5 px-4 text-right">Time</th>
                  <th className="py-2.5 px-4 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSolves.map((s, idx) => (
                  <tr key={s.id || idx} className="border-b border-border/40 last:border-0 hover:bg-bg-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-secondary text-[11px]">
                      {s.puzzle_date}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-text-primary">
                      {s.path && s.path.length > 0 ? (
                        s.path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ')
                      ) : '🎬 > 👤 > 🎬'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {Math.floor(s.time_seconds / 60)}:{String(s.time_seconds % 60).padStart(2, '0')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-accent font-bold">
                      {s.path ? Math.max(0, s.path.length - 1) : s.hop_count * 2}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-bg-card border border-border p-8 rounded text-center text-text-muted text-xs">
            No puzzle solves logged yet. Solve today&apos;s daily challenge to start your stats!
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          onClick={() => setIsEditing(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-card border border-border rounded-[4px] p-6 sm:p-8 max-w-md w-full flex flex-col gap-4 shadow-2xl text-left"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-white">Edit Profile & Handle</h2>
              <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white text-base">✕</button>
            </div>

            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-2.5 rounded">
                {saveError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Unique Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-text-muted font-mono">@</span>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-bg-secondary border border-border text-white text-xs pl-7 pr-3 py-2 rounded focus:outline-none focus:border-accent font-mono"
                />
              </div>
              {availability.checked && (
                <span className={`text-[10px] ${availability.available ? 'text-accent' : 'text-red-400'}`}>
                  {availability.msg}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Bio / Tagline
              </label>
              <textarea
                rows={3}
                placeholder="Share your favorite directors, genres, or film philosophy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-bg-secondary border border-border text-white text-xs p-3 rounded focus:outline-none focus:border-accent placeholder:text-text-muted"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-transparent text-text-secondary hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!availability.available || isSaving}
                className={`px-5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  availability.available && !isSaving
                    ? 'bg-accent text-bg-primary hover:bg-accent-dim'
                    : 'bg-bg-secondary text-text-muted border border-border cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
