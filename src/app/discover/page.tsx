'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';

/* ────── Types ────── */
interface ProfileCard {
  id: string;
  userId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  heightCm: number | null;
  religion: string | null;
  caste: string | null;
  maritalStatus: string | null;
  education: string | null;
  profession: string | null;
  incomeTier: string | null;
  location: string | null;
  bio: string | null;
  photos: string;
  matchScore: number;
}

/* ────── Helpers ────── */
function getAge(dob: string): number {
  if (!dob) return 0;
  try {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  } catch {
    return 0;
  }
}

function parsePhotos(photosStr: string): string[] {
  if (!photosStr) return [];
  try {
    const parsed = JSON.parse(photosStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function DiscoverPage() {
  const { openUpgradeModal } = useModals();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swipeDir, setSwipeDir] = useState<'left' | 'right' | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [isCapped, setIsCapped] = useState(false);
  
  const isFetchingRef = useRef(false);
  const startX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchProfiles = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/matches?limit=20&page=1');
      if (res.status === 404) {
        const data = await res.json();
        setError(data.error || 'Profile needs completion');
        return;
      }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setProfiles(data.profiles ?? []); // Changed matches to profiles to match API
      setIsCapped(data.capped ?? false);
    } catch (err: any) {
      console.error('Fetch profiles error:', err);
      setError('Connection issue. Please try again.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const currentProfile = useMemo(() => profiles[currentIdx] || null, [profiles, currentIdx]);
  const nextProfile = useMemo(() => profiles[currentIdx + 1] || null, [profiles, currentIdx]);

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    setSwipeDir(direction);

    if (direction === 'right') {
      try {
        const res = await fetch('/api/match/interest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: currentProfile.userId }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          if (data.error === "UPGRADE_REQUIRED") {
            openUpgradeModal(data.feature || 'unlimited_interests', data.requiredPlan || 'PRIME');
            return; // Don't proceed with swipe animation if limit reached
          }
          throw new Error(data.error);
        }

        if (Math.random() > 0.8) {
          setShowMatchOverlay(true);
          setTimeout(() => setShowMatchOverlay(false), 2000);
        }
      } catch (err: any) {
        console.error('Swipe interest error:', err);
      }
    }

    setTimeout(() => {
      setSwipeDir(null);
      setDragX(0);
      setCurrentIdx(prev => prev + 1);
      setCurrentPhotoIdx(0);
      setShowDetail(false);
    }, 400);
  }, [currentProfile]);

  const onDragStart = (clientX: number) => {
    setDragging(true);
    startX.current = clientX;
  };
  const onDragMove = (clientX: number) => {
    if (!dragging) return;
    setDragX(clientX - startX.current);
  };
  const onDragEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dragX) > 120) {
      handleSwipe(dragX > 0 ? 'right' : 'left');
    } else {
      setDragX(0);
    }
  };

  const photos = useMemo(() => 
    currentProfile ? parsePhotos(currentProfile.photos) : []
  , [currentProfile]);
  
  const age = useMemo(() => 
    currentProfile ? getAge(currentProfile.dateOfBirth) : 0
  , [currentProfile]);

  const cardStyle = useMemo(() => {
    if (swipeDir === 'right') return { transform: 'translateX(150%) rotate(20deg)', opacity: 0, transition: 'all 0.4s ease-out' };
    if (swipeDir === 'left') return { transform: 'translateX(-150%) rotate(-20deg)', opacity: 0, transition: 'all 0.4s ease-out' };
    if (dragX !== 0) {
      const rotate = dragX * 0.08;
      const scale = 1 - Math.min(Math.abs(dragX) / 1000, 0.05);
      return { transform: `translateX(${dragX}px) rotate(${rotate}deg) scale(${scale})`, transition: dragging ? 'none' : 'all 0.3s ease-out' };
    }
    return { transform: 'translateX(0) rotate(0) scale(1)', transition: 'all 0.3s ease-out' };
  }, [swipeDir, dragX, dragging]);

  const handlePhotoClick = (e: React.MouseEvent) => {
    if (dragging || Math.abs(dragX) > 5) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
      setCurrentPhotoIdx(prev => Math.max(0, prev - 1));
    } else {
      setCurrentPhotoIdx(prev => Math.min(photos.length - 1, prev + 1));
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF1ED]">
        <DashNav />
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="shimmer h-[540px] rounded-[3rem]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF1ED]">
        <DashNav />
        <div className="max-w-lg mx-auto px-4 pt-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl text-error">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <h2 className="text-xl font-black text-stone-800 mb-2">Notice</h2>
          <p className="text-sm text-stone-400 mb-8 max-w-xs">{error}</p>
          <button onClick={fetchProfiles} className="btn-primary px-8">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF1ED] selection:bg-primary/10 overflow-hidden">
      <DashNav />
      <div className="max-w-lg mx-auto px-4 pt-4 pb-24 h-[calc(100vh-80px)] flex flex-col relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div>
            <h1 className="font-headline text-3xl font-black text-stone-900 tracking-tight">Discover</h1>
            <p className="text-[10px] uppercase tracking-widest font-black text-primary mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Perfect Matches
            </p>
          </div>
          <Link href="/search" className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-stone-600 text-xs font-bold hover:bg-stone-50 border border-stone-200 transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-lg">tune</span>
            Filters
          </Link>
        </div>

        {/* Card Stack Container */}
        <div className="relative flex-1 min-h-0 perspective-1000 mb-6">
          {!currentProfile ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-[3rem] p-10 text-center bg-white border-none shadow-xl">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-6 text-stone-300">
                <span className="material-symbols-outlined text-4xl">person_search</span>
              </div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">No more profiles</h2>
              <p className="text-sm text-stone-500 max-w-[200px] mx-auto">Check back later or try adjusting your filters to find more matches.</p>
            </div>
          ) : isCapped && currentIdx >= 10 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center glass-card rounded-[3rem] p-10 text-center animate-fade-in bg-white border-none shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-stone-50/50 backdrop-blur-[2px] z-0" />
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-inner mx-auto text-primary">
                  <span className="material-symbols-outlined text-5xl">lock</span>
                </div>
                <h2 className="font-headline text-3xl font-black text-stone-800 mb-4">Unlock More Profiles</h2>
                <p className="text-sm text-stone-500 mb-10 leading-relaxed max-w-[260px] mx-auto font-medium">
                  You&apos;ve seen 10 profiles today. Upgrade to Prime to discover unlimited matches!
                </p>
                <div className="flex flex-col w-full gap-4 max-w-[280px] mx-auto">
                  <Link href="/premium" className="btn-primary w-full flex items-center justify-center gap-3 py-4 shadow-xl shadow-primary/20 text-sm font-black uppercase tracking-widest">
                    Upgrade Now
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Next card (behind) */}
              {nextProfile && (
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden scale-[0.94] translate-y-6 opacity-30 blur-[2px] transition-all duration-500 bg-white shadow-xl">
                  <div className="w-full h-full bg-stone-50" />
                </div>
              )}

              {/* Current card */}
              <div
                ref={cardRef}
                style={cardStyle}
                className="absolute inset-0 glass-card rounded-[3rem] overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl bg-white border-none"
                onMouseDown={e => onDragStart(e.clientX)}
                onMouseMove={e => onDragMove(e.clientX)}
                onMouseUp={onDragEnd}
                onMouseLeave={() => dragging && onDragEnd()}
                onTouchStart={e => onDragStart(e.touches[0].clientX)}
                onTouchMove={e => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd}
              >
                {/* Photo area */}
                <div 
                  className="relative h-full bg-stone-100 overflow-hidden group/photo"
                  onClick={handlePhotoClick}
                >
                  {/* Photo indicators */}
                  {photos.length > 1 && (
                    <div className="absolute top-6 inset-x-8 z-40 flex gap-2">
                      {photos.map((_, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full bg-black/10 overflow-hidden backdrop-blur-sm">
                          <div className={`h-full bg-white transition-all duration-300 ${i === currentPhotoIdx ? 'w-full' : 'w-0'}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {photos.length > 0 ? (
                    <img 
                      src={photos[currentPhotoIdx]} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover/photo:scale-105" 
                      draggable={false} 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
                      <span className="material-symbols-outlined text-7xl text-stone-200 mb-4">person</span>
                      <p className="text-xs text-stone-400 font-black uppercase tracking-widest leading-loose">No Photos Available</p>
                    </div>
                  )}

                  {/* Gradient overlays */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-20" />

                  {/* Info area */}
                  <div className={`absolute bottom-0 left-0 right-0 p-8 z-30 transition-all duration-500 ${showDetail ? 'translate-y-[-50%]' : 'translate-y-0'}`}>
                    <div className="flex items-end justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-headline text-3xl font-black text-white truncate drop-shadow-lg">
                            {(currentProfile.fullName || 'User').split(' ')[0]}{age > 0 ? `, ${age}` : ''}
                          </h2>
                          <span className="material-symbols-outlined text-primary text-2xl fill-1 bg-white rounded-full p-0.5 shadow-sm">verified</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90 font-bold text-sm">
                          <span className="material-symbols-outlined text-lg">location_on</span>
                          {currentProfile.location || 'Remote'}
                        </div>
                      </div>
                      <button 
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/20 backdrop-blur-md text-white border border-white/30`}
                        onClick={e => { e.stopPropagation(); setShowDetail(!showDetail); }}
                      >
                        <span className="material-symbols-outlined text-2xl font-bold transition-transform duration-500" style={{ transform: showDetail ? 'rotate(180deg)' : 'rotate(0)' }}>
                          expand_less
                        </span>
                      </button>
                    </div>

                    {/* Detailed Info */}
                    <div className={`mt-8 space-y-5 transition-all duration-500 ${showDetail ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                      <div className="flex flex-wrap gap-2">
                        {[currentProfile.religion, currentProfile.caste, currentProfile.profession, currentProfile.maritalStatus]
                          .filter(Boolean)
                          .map((tag, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider text-white">
                              {tag}
                            </div>
                          ))
                        }
                      </div>
                      
                      <div className="bg-black/20 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10">
                        <p className="text-sm text-white/90 leading-relaxed font-medium italic">
                          &quot;{currentProfile.bio || 'Finding my person to start a beautiful new chapter together.'}&quot;
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Profession</p>
                          <p className="text-sm font-bold text-white truncate">{currentProfile.profession || 'Professional'}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Education</p>
                          <p className="text-sm font-bold text-white truncate">{currentProfile.education || 'Graduate'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Overlay */}
                {showMatchOverlay && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-primary/95 backdrop-blur-2xl animate-scale-in text-white p-12 text-center">
                    <span className="material-symbols-outlined text-8xl mb-8 animate-bounce">favorite</span>
                    <h3 className="font-headline text-5xl font-black mb-4">It&apos;s a Match!</h3>
                    <p className="text-white/80 font-medium text-lg">Express mutual interest to start chatting.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {currentProfile && (
          <div className="flex items-center justify-center gap-8 shrink-0 pb-4">
            <button onClick={() => handleSwipe('left')} className="w-16 h-16 rounded-full bg-white shadow-2xl border border-stone-100 flex items-center justify-center text-stone-400 hover:text-error transition-all hover:scale-110 active:scale-90"><span className="material-symbols-outlined text-3xl">close</span></button>
            <button onClick={() => handleSwipe('right')} className="w-20 h-20 rounded-full bg-primary shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-90 shadow-primary/20"><span className="material-symbols-outlined text-4xl fill-1">favorite</span></button>
            <button onClick={() => setShowDetail(!showDetail)} className="w-16 h-16 rounded-full bg-white shadow-2xl border border-stone-100 flex items-center justify-center text-stone-400 hover:text-primary transition-all hover:scale-110 active:scale-90"><span className="material-symbols-outlined text-3xl">info</span></button>
          </div>
        )}
      </div>
    </div>
  );
}
