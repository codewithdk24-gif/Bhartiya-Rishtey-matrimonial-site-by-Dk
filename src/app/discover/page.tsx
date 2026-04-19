'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ────── Nav ────── */
function DashNav() {
  const router = useRouter();
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };
  const links = [
    { h: '/dashboard', i: 'dashboard', l: 'Dashboard' },
    { h: '/discover', i: 'local_fire_department', l: 'For You' },
    { h: '/search', i: 'search', l: 'Search' },
    { h: '/likes', i: 'favorite', l: 'Likes' },
    { h: '/chat', i: 'chat', l: 'Messages' },
    { h: '/profile', i: 'person', l: 'Profile' },
  ];
  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/discover" className="flex items-center gap-2">
          <span className="font-headline text-lg font-bold text-[#9b1c31] hidden sm:block">Bhartiya Rishtey</span>
        </Link>
        <div className="hidden md:flex items-center gap-0.5">
          {links.map(link => (
            <Link key={link.h} href={link.h} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${link.h === '/discover' ? 'text-primary bg-primary/5' : 'text-stone-500 hover:text-primary hover:bg-primary/5'}`}>
              <span className="material-symbols-outlined text-lg">{link.i}</span>{link.l}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/payment" className="p-2 rounded-xl hover:bg-gold/10 transition-colors" title="Premium">
            <span className="material-symbols-outlined text-gold">diamond</span>
          </Link>
          <button onClick={handleLogout} className="p-2 rounded-xl text-stone-400 hover:text-error hover:bg-error/5 transition-all">
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-50 px-1 py-1 flex justify-around">
        {links.map(link => (
          <Link key={link.h} href={link.h} className={`flex flex-col items-center gap-0 px-1 py-1.5 rounded-xl text-[8px] min-[360px]:text-[10px] font-medium transition-all ${link.h === '/discover' ? 'text-primary' : 'text-stone-400'}`}>
            <span className="material-symbols-outlined text-lg min-[360px]:text-xl">{link.i}</span>
            <span className="whitespace-nowrap">{link.l}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/* ────── Swipe Card ────── */
interface ProfileCard {
  id: string;
  userId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  heightCm: number | null;
  religion: string | null;
  caste: string | null;
  location: string | null;
  education: string | null;
  profession: string | null;
  incomeTier: string | null;
  bio: string | null;
  photos: string;
  matchScore: number;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getPhotos(photosStr: string): string[] {
  try {
    const parsed = JSON.parse(photosStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matches?limit=20&page=1');
      const data = await res.json();
      setProfiles(data.matches ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const currentProfile = profiles[currentIdx];
  const nextProfile = profiles[currentIdx + 1];

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    setSwipeDir(direction);

    if (direction === 'right') {
      // Send interest (like)
      try {
        await fetch('/api/match/interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: currentProfile.userId }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Animate out then advance
    setTimeout(() => {
      setSwipeDir(null);
      setDragX(0);
      setCurrentIdx(prev => prev + 1);
      setShowDetail(false);
    }, 400);
  };

  /* Touch/Mouse drag */
  const onDragStart = (clientX: number) => {
    setDragging(true);
    startX.current = clientX;
  };
  const onDragMove = (clientX: number) => {
    if (!dragging) return;
    setDragX(clientX - startX.current);
  };
  const onDragEnd = () => {
    setDragging(false);
    if (Math.abs(dragX) > 120) {
      handleSwipe(dragX > 0 ? 'right' : 'left');
    } else {
      setDragX(0);
    }
  };

  const photos = currentProfile ? getPhotos(currentProfile.photos) : [];
  const age = currentProfile ? getAge(currentProfile.dateOfBirth) : 0;

  const getCardStyle = () => {
    if (swipeDir === 'right') return { transform: 'translateX(150%) rotate(20deg)', opacity: 0, transition: 'all 0.4s ease-out' };
    if (swipeDir === 'left') return { transform: 'translateX(-150%) rotate(-20deg)', opacity: 0, transition: 'all 0.4s ease-out' };
    if (dragX !== 0) {
      const rotate = dragX * 0.08;
      return { transform: `translateX(${dragX}px) rotate(${rotate}deg)`, transition: dragging ? 'none' : 'all 0.3s ease-out' };
    }
    return { transform: 'translateX(0) rotate(0)', transition: 'all 0.3s ease-out' };
  };

  if (loading) {
    return (
      <>
        <DashNav />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="shimmer h-[500px] rounded-3xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashNav />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-headline text-2xl font-bold text-stone-900">For You</h1>
            <p className="text-xs text-stone-400">Swipe right to like, left to skip</p>
          </div>
          <Link href="/search" className="flex items-center gap-1 px-3 py-2 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors">
            <span className="material-symbols-outlined text-sm">tune</span>
            Filters
          </Link>
        </div>

        {/* Card Stack */}
        <div className="relative" style={{ height: '520px' }}>
          {!currentProfile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-3xl">
              <span className="material-symbols-outlined text-7xl text-stone-300 mb-4">search_off</span>
              <h2 className="font-headline text-xl font-bold text-stone-700 mb-2">No more profiles</h2>
              <p className="text-sm text-stone-400 text-center px-6 mb-6">You&apos;ve seen all available profiles. Check back later!</p>
              <button onClick={() => { setCurrentIdx(0); fetchProfiles(); }} className="btn-primary text-sm px-6 py-2.5">
                <span className="material-symbols-outlined text-lg">refresh</span> Refresh
              </button>
            </div>
          ) : (
            <>
              {/* Next card (behind) */}
              {nextProfile && (
                <div className="absolute inset-0 glass-card rounded-3xl overflow-hidden scale-[0.95] opacity-60">
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-stone-300">person</span>
                  </div>
                </div>
              )}

              {/* Current card */}
              <div
                ref={cardRef}
                style={getCardStyle()}
                className="absolute inset-0 glass-card rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-xl"
                onMouseDown={e => onDragStart(e.clientX)}
                onMouseMove={e => onDragMove(e.clientX)}
                onMouseUp={onDragEnd}
                onMouseLeave={() => dragging && onDragEnd()}
                onTouchStart={e => onDragStart(e.touches[0].clientX)}
                onTouchMove={e => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd}
              >
                {/* Like/Nope indicators */}
                {dragX > 50 && (
                  <div className="absolute top-8 left-6 z-30 px-4 py-2 rounded-xl border-3 border-success text-success font-bold text-2xl rotate-[-15deg] animate-fade-in-up" style={{ borderWidth: '3px' }}>
                    LIKE ❤️
                  </div>
                )}
                {dragX < -50 && (
                  <div className="absolute top-8 right-6 z-30 px-4 py-2 rounded-xl border-3 border-error text-error font-bold text-2xl rotate-[15deg] animate-fade-in-up" style={{ borderWidth: '3px' }}>
                    NOPE ✕
                  </div>
                )}

                {/* Photo area */}
                <div className="relative h-[65%] bg-gradient-to-br from-primary/10 via-gold/5 to-accent/10 overflow-hidden">
                  {photos.length > 0 ? (
                    <img src={photos[0]} alt={currentProfile.fullName} className="w-full h-full object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-white/50 flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-6xl text-primary/30">person</span>
                      </div>
                      <p className="text-sm text-stone-400 font-medium">{currentProfile.fullName}</p>
                    </div>
                  )}

                  {/* Match badge */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white shadow-lg">
                      {currentProfile.matchScore}% Match
                    </span>
                  </div>

                  {/* Gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
                </div>

                {/* Info area */}
                <div className="p-5 relative" onClick={() => setShowDetail(!showDetail)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-headline text-2xl font-bold text-stone-900">
                        {currentProfile.fullName}{age > 0 ? `, ${age}` : ''}
                      </h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {currentProfile.profession && (
                          <span className="text-xs bg-primary/5 text-primary px-2.5 py-1 rounded-full font-medium">
                            💼 {currentProfile.profession}
                          </span>
                        )}
                        {currentProfile.location && (
                          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                            📍 {currentProfile.location}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {currentProfile.religion && (
                          <span className="text-xs bg-gold/10 text-gold px-2.5 py-1 rounded-full font-medium">
                            🙏 {currentProfile.religion}
                          </span>
                        )}
                        {currentProfile.education && (
                          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                            🎓 {currentProfile.education}
                          </span>
                        )}
                        {currentProfile.heightCm && (
                          <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">
                            📏 {currentProfile.heightCm}cm
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors" onClick={e => { e.stopPropagation(); setShowDetail(!showDetail); }}>
                      <span className="material-symbols-outlined text-stone-500 text-sm">{showDetail ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  </div>

                  {showDetail && currentProfile.bio && (
                    <div className="mt-3 pt-3 border-t border-stone-100 animate-fade-in-up">
                      <p className="text-sm text-stone-600 leading-relaxed">{currentProfile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {currentProfile && (
          <div className="flex items-center justify-center gap-5 mt-6">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-white shadow-lg border border-stone-200 flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-3xl text-error">close</span>
            </button>

            <button
              onClick={() => handleSwipe('right')}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-500 shadow-lg flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-4xl text-white">favorite</span>
            </button>

            <button
              onClick={() => setShowDetail(!showDetail)}
              className="w-16 h-16 rounded-full bg-white shadow-lg border border-stone-200 flex items-center justify-center hover:shadow-xl hover:scale-110 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-3xl text-primary">info</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
