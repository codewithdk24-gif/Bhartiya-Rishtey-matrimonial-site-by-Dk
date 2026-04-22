'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';
import ProfileGate from '@/components/ProfileGate';
import { useSession } from 'next-auth/react';

/* ────── Types ────── */
interface ProfileCard {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  profession: string;
  location: string;
  photos: string;
  matchScore: number;
  activityStatus: string;
  isVerified: boolean;
}

/* ────── Helpers ────── */
function parsePhotos(photosStr: string): string[] {
  if (!photosStr) return [];
  try {
    const parsed = JSON.parse(photosStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export default function DiscoverPage() {
  const { data: session } = useSession();
  const { openUpgradeModal } = useModals();
  
  // ────── State ──────
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // ────── Filter State ──────
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 60,
    religion: 'All',
    verifiedOnly: false,
    photosOnly: false,
    sort: 'best_match'
  });

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  
  // ────── Infinite Scroll Observer ──────
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProfileRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // ────── Data Fetching ──────
  const fetchProfiles = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    try {
      const query = new URLSearchParams({
        limit: '16',
        page: pageNum.toString(),
        sort: filters.sort,
        minAge: filters.ageMin.toString(),
        maxAge: filters.ageMax.toString(),
        religion: filters.religion,
        verifiedOnly: filters.verifiedOnly.toString(),
        photosOnly: filters.photosOnly.toString()
      });

      const res = await fetch(`/api/matches?${query}`);
      const data = await res.json();

      if (res.status === 403 && data.error === 'PROFILE_INCOMPLETE') {
        setError('PROFILE_INCOMPLETE');
        return;
      }
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      if (isLoadMore) {
        setProfiles(prev => [...prev, ...data.profiles]);
      } else {
        setProfiles(data.profiles);
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProfiles(page, page > 1);
  }, [page, fetchProfiles]);

  useEffect(() => {
    setPage(1);
    setProfiles([]);
  }, [filters]);

  // ────── Interactions ──────
  const handleInterest = async (receiverId: string) => {
    if (processingIds.has(receiverId)) return;
    setProcessingIds(prev => new Set(prev).add(receiverId));
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      });
      if (res.ok) setProfiles(prev => prev.filter(p => p.userId !== receiverId));
      else {
        const data = await res.json();
        if (data.error === "UPGRADE_REQUIRED") openUpgradeModal(data.feature, data.requiredPlan);
      }
    } catch (err) { console.error(err); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(receiverId); return n; }); }
  };

  const toggleSave = async (targetUserId: string) => {
    setSavedIds(prev => {
      const n = new Set(prev);
      if (n.has(targetUserId)) n.delete(targetUserId);
      else n.add(targetUserId);
      return n;
    });
    try {
      await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
    } catch (err) { console.error(err); }
  };

  const resetFilters = () => {
    setFilters({
      ageMin: 18,
      ageMax: 60,
      religion: 'All',
      verifiedOnly: false,
      photosOnly: false,
      sort: 'best_match'
    });
  };

  const removeFilterChip = (key: string) => {
    if (key === 'age') setFilters(prev => ({ ...prev, ageMin: 18, ageMax: 60 }));
    if (key === 'religion') setFilters(prev => ({ ...prev, religion: 'All' }));
    if (key === 'verified') setFilters(prev => ({ ...prev, verifiedOnly: false }));
    if (key === 'photos') setFilters(prev => ({ ...prev, photosOnly: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 selection:bg-rose-100">
      <DashNav />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
        <ProfileGate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* SIDEBAR FILTERS */}
            <aside className="lg:col-span-3 hidden xl:block sticky top-24 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Preferences</h3>
                  <button onClick={resetFilters} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Reset All</button>
               </div>

               <div className="space-y-8">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Age Range</label>
                        <span className="text-[10px] font-bold text-stone-900">{filters.ageMin} - {filters.ageMax}</span>
                     </div>
                     <input 
                       type="range" min="18" max="60" value={filters.ageMax} 
                       onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))}
                       className="w-full accent-rose-500 h-1.5 bg-rose-100 rounded-full appearance-none cursor-pointer"
                     />
                  </div>

                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Religion</label>
                     <select 
                       value={filters.religion} onChange={(e) => setFilters(prev => ({ ...prev, religion: e.target.value }))}
                       className="w-full bg-white border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                     >
                        <option>All</option>
                        <option>Hindu</option>
                        <option>Muslim</option>
                        <option>Sikh</option>
                        <option>Christian</option>
                        <option>Jain</option>
                     </select>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600">Verified Only</span>
                        <button 
                          onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${filters.verifiedOnly ? 'bg-rose-500' : 'bg-stone-200'}`}
                        >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${filters.verifiedOnly ? 'left-6' : 'left-1'}`} />
                        </button>
                     </div>
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600">Must Have Photos</span>
                        <button 
                          onClick={() => setFilters(prev => ({ ...prev, photosOnly: !prev.photosOnly }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${filters.photosOnly ? 'bg-rose-500' : 'bg-stone-200'}`}
                        >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${filters.photosOnly ? 'left-6' : 'left-1'}`} />
                        </button>
                     </div>
                  </div>
               </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-12 xl:col-span-6 min-w-0">
               <header className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-stone-900 tracking-tight">Discover Matches</h1>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Handpicked based on your profile preferences</p>
                    </div>
                    <select 
                      value={filters.sort} onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                      className="bg-white border border-rose-50 rounded-full px-5 py-2.5 text-[9px] font-black uppercase tracking-widest text-stone-500 outline-none focus:ring-2 focus:ring-rose-100 cursor-pointer"
                    >
                      <option value="best_match">Best Match</option>
                      <option value="recently_active">Recently Active</option>
                      <option value="new_profiles">Newest First</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                     <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest mr-2">Filters:</span>
                     {(filters.ageMin !== 18 || filters.ageMax !== 60) && (
                        <button onClick={() => removeFilterChip('age')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           {filters.ageMin}-{filters.ageMax} Years <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                     {filters.religion !== 'All' && (
                        <button onClick={() => removeFilterChip('religion')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           {filters.religion} <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                     {filters.verifiedOnly && (
                        <button onClick={() => removeFilterChip('verified')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           Verified <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                     {filters.photosOnly && (
                        <button onClick={() => removeFilterChip('photos')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           Photos <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                  </div>
               </header>

               {error === 'PROFILE_INCOMPLETE' ? (
                 <div className="bg-white rounded-[3rem] p-12 text-center shadow-xl border border-rose-50">
                    <span className="material-symbols-outlined text-6xl text-rose-300 mb-6 fill-1">person_edit</span>
                    <h2 className="text-2xl font-black mb-4 tracking-tight">Complete Profile</h2>
                    <p className="text-stone-400 text-sm mb-8 font-medium">Unlock daily matches by completing your profile details.</p>
                    <Link href="/profile" className="px-10 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 inline-block">Complete Now</Link>
                 </div>
               ) : (
                 <div className="space-y-12">
                   
                   {!loading && profiles.length === 0 && (
                     <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-20 text-center border border-dashed border-rose-200 animate-fade-in">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-200"><span className="material-symbols-outlined text-4xl">search_off</span></div>
                        <h3 className="text-xl font-black text-stone-800 mb-2 tracking-tight">No matches found</h3>
                        <p className="text-sm text-stone-400 max-w-xs mx-auto mb-8 font-medium leading-relaxed">Try broadening your search preferences.</p>
                        <button onClick={resetFilters} className="px-8 py-3 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100">Relax Filters</button>
                     </div>
                   )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {loading && page === 1 && [1,2,3,4,5,6].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] p-4 border border-white h-[400px] animate-pulse" />
                     ))}

                     {profiles.map((p, idx) => (
                       <div 
                         key={p.id} 
                         ref={idx === profiles.length - 1 ? lastProfileRef : null}
                         className="bg-white rounded-[2rem] p-4 border border-white shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group overflow-hidden"
                       >
                         <div className="flex items-center justify-between mb-3 relative z-10">
                            <div className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                              {p.matchScore}% Match {p.isVerified && <span className="material-symbols-outlined text-[10px] fill-1">verified</span>}
                            </div>
                            <button 
                              onClick={() => toggleSave(p.userId)} 
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${savedIds.has(p.userId) ? 'bg-rose-600 text-white shadow-lg' : 'bg-stone-50 text-stone-300 hover:text-rose-400'}`}
                            >
                              <span className={`material-symbols-outlined text-base ${savedIds.has(p.userId) ? 'fill-1' : ''}`}>favorite</span>
                            </button>
                         </div>

                         <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-stone-50 group-hover:shadow-lg transition-all">
                           <img 
                             src={parsePhotos(p.photos)[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} 
                             alt={p.fullName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy"
                           />
                           <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest text-rose-500 opacity-0 group-hover:opacity-100 transition-all">{p.activityStatus}</div>
                         </div>
                         
                         <div className="space-y-3">
                           <div>
                              <h4 className="text-sm font-black text-stone-900 truncate">{p.fullName}, {p.age}</h4>
                              <p className="text-[9px] font-bold text-stone-400 truncate mt-1">{p.profession} • {p.location}</p>
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                              <button 
                                onClick={() => handleInterest(p.userId)} disabled={processingIds.has(p.userId)}
                                className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all disabled:opacity-50"
                              >
                                {processingIds.has(p.userId) ? 'Sending...' : 'Send Interest'}
                              </button>
                              <Link href={`/profile/${p.userId}`} className="w-full py-2.5 bg-stone-50 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all border border-stone-100">View Profile</Link>
                           </div>
                         </div>
                       </div>
                     ))}
                     
                     {/* END CTA CARD (Explore More Matches) */}
                     {!loading && profiles.length > 0 && (
                        <div className="bg-gradient-to-br from-rose-50 via-white to-rose-50 rounded-[2rem] p-8 border border-white shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 border-dashed border-rose-200 min-h-[400px]">
                           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl text-rose-300 group-hover:scale-110 group-hover:rotate-6 transition-all">
                              <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                           </div>
                           <h3 className="text-lg font-black text-stone-800 mb-2">Explore More Matches</h3>
                           <p className="text-[11px] text-stone-500 mb-8 leading-relaxed max-w-[200px]">Find profiles similar to your preferences and widen your horizon.</p>
                           <button 
                             onClick={() => hasMore ? setPage(prev => prev + 1) : resetFilters()}
                             className="px-8 py-3 bg-white text-rose-600 border-2 border-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-100"
                           >
                             {hasMore ? 'View More →' : 'Expand Search'}
                           </button>
                        </div>
                     )}

                     {loadingMore && [1,2].map(i => (
                        <div key={i} className="bg-white/50 rounded-[2rem] p-4 border border-white h-[400px] animate-pulse" />
                     ))}
                   </div>

                   {hasMore && !loading && !loadingMore && (
                     <div className="text-center py-20">
                        <button 
                          onClick={() => setPage(prev => prev + 1)} 
                          className="px-12 py-5 bg-stone-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:-translate-y-1 transition-all"
                        >
                          Load More Matches →
                        </button>
                     </div>
                   )}
                 </div>
               )}
            </div>

            {/* RIGHT SIDEBAR */}
            <aside className="lg:col-span-3 hidden xl:block space-y-6 sticky top-24">
               <div className="bg-white rounded-[2.5rem] p-8 border border-white shadow-2xl shadow-rose-100/30 relative overflow-hidden group">
                  <h3 className="text-base font-black text-stone-900 mb-3 tracking-tight flex items-center gap-2">
                     <span className="material-symbols-outlined text-amber-500 fill-1">bolt</span>
                     Profile Boost
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed font-medium mb-8">Increase your visibility by 5x today.</p>
                  <Link href="/premium" className="block w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-xl shadow-stone-100">Boost Now</Link>
               </div>

               <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                  <h3 className="text-sm font-black text-rose-500 mb-2 flex items-center gap-2 uppercase tracking-widest">Identity Shield</h3>
                  <p className="text-stone-400 text-[10px] font-bold leading-relaxed mb-8 uppercase tracking-widest">Get verified to build instant trust.</p>
                  <button onClick={() => openUpgradeModal('verification', 'PRIME')} className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/40">Verify Now</button>
               </div>
            </aside>

          </div>
        </ProfileGate>
      </main>
    </div>
  );
}
