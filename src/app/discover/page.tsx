'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';
import ProfileGate from '@/components/ProfileGate';
import { useSession } from 'next-auth/react';
import { formatLocation } from '@/lib/location';

/* ────── Types ────── */
interface ProfileCard {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  profession: string;
  location: string;
  city?: string;
  state?: string;
  photos: string;
  matchScore: number;
  activityStatus: string;
  isVerified: boolean;
  interestStatus: string | null;
  conversationId: string | null;
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRelaxed, setIsRelaxed] = useState(false);
  
  // ────── Filter State ──────
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 60,
    minHeight: 140,
    maxHeight: 220,
    religion: 'All',
    caste: '',
    education: '',
    profession: '',
    incomeTier: 'All',
    maritalStatus: 'All',
    smoking: false,
    drinking: false,
    verifiedOnly: false,
    photosOnly: false,
    recentlyActive: false,
    sort: 'best_match'
  });

  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [sentInterestIds, setSentInterestIds] = useState<Set<string>>(new Set());
  
  // ────── Infinite Scroll Observer ──────
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProfileRef = useCallback((node: HTMLDivElement) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
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
        limit: '12',
        page: pageNum.toString(),
        sort: filters.sort,
        minAge: filters.ageMin.toString(),
        maxAge: filters.ageMax.toString(),
        minHeight: filters.minHeight.toString(),
        maxHeight: filters.maxHeight.toString(),
        religion: filters.religion,
        caste: filters.caste,
        education: filters.education,
        profession: filters.profession,
        incomeTier: filters.incomeTier,
        maritalStatus: filters.maritalStatus,
        smoking: filters.smoking.toString(),
        drinking: filters.drinking.toString(),
        verifiedOnly: filters.verifiedOnly.toString(),
        photosOnly: filters.photosOnly.toString(),
        recentlyActive: filters.recentlyActive.toString(),
      });

      const res = await fetch(`/api/discover?${query.toString()}`);
      const data = await res.json();

      if (res.status === 403 && data.error === 'PROFILE_INCOMPLETE') {
        setError('PROFILE_INCOMPLETE');
        return;
      }
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      if (data.profiles) {
        setProfiles(prev => isLoadMore ? [...prev, ...data.profiles] : data.profiles);
        setHasMore(data.hasMore);
        setIsRelaxed(data.isRelaxed || false);
        
        // Sync sent interests from API
        const apiSentIds = data.profiles.filter((p: any) => p.hasSentInterest).map((p: any) => p.userId);
        if (apiSentIds.length > 0) {
          setSentInterestIds(prev => {
            const next = new Set(prev);
            apiSentIds.forEach((id: string) => next.add(id));
            return next;
          });
        }
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      setError("Unable to load profiles. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    console.log("profiles loaded:", profiles.length);
    fetchProfiles(page, page > 0);
  }, [page, fetchProfiles]);

  useEffect(() => {
    setPage(0);
    setProfiles([]);
    setIsRelaxed(false);
  }, [filters]);

  // ────── Interactions ──────
  const handleInterest = async (receiverId: string) => {
    console.log("Sending interest to:", receiverId);
    if (processingIds.has(receiverId) || sentInterestIds.has(receiverId)) return;
    setProcessingIds(prev => new Set(prev).add(receiverId));
    try {
      const res = await fetch('/api/interests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: receiverId }),
      });
      console.log("Interest API status:", res.status);
      const data = await res.json();
      if (res.ok) {
        console.log("Interest success:", data);
        setSentInterestIds(prev => new Set(prev).add(receiverId));
      } else {
        console.error("Interest API Error:", data.error);
        if (data.error === "UPGRADE_REQUIRED") openUpgradeModal(data.feature, data.requiredPlan);
        else alert(data.error || "Failed to send interest");
      }
    } catch (err) { console.error("Interest Request Failed:", err); }
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
      minHeight: 140,
      maxHeight: 220,
      religion: 'All',
      caste: '',
      education: '',
      profession: '',
      incomeTier: 'All',
      maritalStatus: 'All',
      smoking: false,
      drinking: false,
      verifiedOnly: false,
      photosOnly: false,
      recentlyActive: false,
      sort: 'best_match'
    });
  };

  const removeFilterChip = (key: string) => {
    if (key === 'age') setFilters(prev => ({ ...prev, ageMin: 18, ageMax: 60 }));
    if (key === 'religion') setFilters(prev => ({ ...prev, religion: 'All' }));
    if (key === 'marital') setFilters(prev => ({ ...prev, maritalStatus: 'All' }));
    if (key === 'income') setFilters(prev => ({ ...prev, incomeTier: 'All' }));
    if (key === 'verified') setFilters(prev => ({ ...prev, verifiedOnly: false }));
    if (key === 'photos') setFilters(prev => ({ ...prev, photosOnly: false }));
    if (key === 'active') setFilters(prev => ({ ...prev, recentlyActive: false }));
    if (key === 'caste') setFilters(prev => ({ ...prev, caste: '' }));
    if (key === 'height') setFilters(prev => ({ ...prev, minHeight: 140, maxHeight: 220 }));
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
                        {['Hindu','Muslim','Sikh','Christian','Buddhist','Jain','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Marital Status</label>
                     <select 
                       value={filters.maritalStatus} onChange={(e) => setFilters(prev => ({ ...prev, maritalStatus: e.target.value }))}
                       className="w-full bg-white border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                     >
                        <option>All</option>
                        {['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'].map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>

                  <div className="pt-4 space-y-4">
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
                        <span className="text-xs font-bold text-stone-600">With Photos Only</span>
                        <button 
                          onClick={() => setFilters(prev => ({ ...prev, photosOnly: !prev.photosOnly }))}
                          className={`w-10 h-5 rounded-full transition-all relative ${filters.photosOnly ? 'bg-rose-500' : 'bg-stone-200'}`}
                        >
                           <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${filters.photosOnly ? 'left-6' : 'left-1'}`} />
                        </button>
                     </div>
                  </div>

                  <button 
                    onClick={() => setShowMoreFilters(true)}
                    className="w-full py-4 bg-stone-50 border border-stone-100 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-100 transition-all"
                  >
                    <span className="material-symbols-outlined text-base">tune</span>
                    More Filters
                  </button>

                  <button 
                    onClick={() => setPage(0)}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all"
                  >
                    Apply Filters
                  </button>
               </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-9 min-w-0">
               <header className="mb-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-stone-900 tracking-tight">Discover Matches</h1>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Showing matches based on your preferences</p>
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
                     <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest mr-2">Active Filters:</span>
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
                     {filters.maritalStatus !== 'All' && (
                        <button onClick={() => removeFilterChip('marital')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           {filters.maritalStatus} <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                     {filters.incomeTier !== 'All' && (
                        <button onClick={() => removeFilterChip('income')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           {filters.incomeTier} <span className="material-symbols-outlined text-[10px]">close</span>
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
                     {filters.recentlyActive && (
                        <button onClick={() => removeFilterChip('active')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           Recent <span className="material-symbols-outlined text-[10px]">close</span>
                        </button>
                     )}
                     {filters.caste && (
                        <button onClick={() => removeFilterChip('caste')} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 hover:bg-rose-100">
                           {filters.caste} <span className="material-symbols-outlined text-[10px]">close</span>
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
                <div className="space-y-12 h-auto overflow-visible">
                   
                   {!loading && profiles.length === 0 && (
                     <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-20 text-center border border-dashed border-rose-200 animate-fade-in">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-200"><span className="material-symbols-outlined text-4xl">search_off</span></div>
                        <h3 className="text-xl font-black text-stone-800 mb-2 tracking-tight">No matches found</h3>
                        <p className="text-sm text-stone-400 max-w-xs mx-auto mb-8 font-medium leading-relaxed">Try broadening your search preferences.</p>
                        <button onClick={resetFilters} className="px-8 py-3 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100">Relax Filters</button>
                     </div>
                   )}

                    {isRelaxed && (
                       <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 animate-fade-in">
                          <span className="material-symbols-outlined text-amber-500">info</span>
                          <p className="text-xs font-bold text-amber-700">Showing more matches outside your exact preferences to help you discover more.</p>
                       </div>
                    )}

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {loading && page === 0 && [1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="bg-white rounded-[2rem] p-4 border border-white h-[450px] animate-pulse" />
                     ))}

                     {profiles.map((p, idx) => (
                       <div 
                         key={p.id} 
                         ref={idx === profiles.length - 1 ? lastProfileRef : null}
                         className="bg-white rounded-[2rem] p-4 border border-white shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 group overflow-hidden flex flex-col h-full"
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
                         
                         <div className="space-y-3 flex-1 flex flex-col justify-between">
                            <div className="flex-1 min-w-0">
                               <h3 className="text-[13px] font-black text-stone-900 leading-none truncate group-hover:text-rose-600 transition-colors">{p.fullName}, {p.age}</h3>
                               <p className="text-[9px] font-bold text-rose-500 truncate mt-1">{p.profession}</p>
                               <p className="text-[9px] font-bold text-stone-400 truncate mt-0.5 flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[10px]">location_on</span>
                                 {formatLocation(p)}
                               </p>
                            </div>
                           <div className="grid grid-cols-1 gap-2 mt-4">
                              <button 
                                onClick={() => handleInterest(p.userId)} 
                                disabled={processingIds.has(p.userId) || sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING' || p.interestStatus === 'ACCEPTED' || p.interestStatus === 'REJECTED'}
                                className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg transition-all disabled:opacity-80 flex items-center justify-center gap-2 ${
                                  (p.interestStatus === 'ACCEPTED') 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-none' 
                                    : (p.interestStatus === 'REJECTED')
                                    ? 'bg-stone-100 text-stone-400 shadow-none'
                                    : (sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING')
                                    ? 'bg-stone-100 text-stone-500 shadow-none border border-stone-200' 
                                    : 'bg-rose-600 text-white shadow-rose-100 hover:bg-rose-700'
                                }`}
                              >
                                {processingIds.has(p.userId) ? (
                                  'Sending...'
                                ) : (p.interestStatus === 'ACCEPTED') ? (
                                  <>Accepted <span className="material-symbols-outlined text-xs">verified_user</span></>
                                ) : (p.interestStatus === 'REJECTED') ? (
                                  'Not Interested'
                                ) : (sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING') ? (
                                  <>Interest Sent <span className="material-symbols-outlined text-xs">done</span></>
                                ) : (
                                  'Send Interest'
                                )}
                              </button>

                              {p.interestStatus === 'ACCEPTED' && p.conversationId && (
                                <Link 
                                  href={`/chat/${p.conversationId}`}
                                  className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                  Start Chat <span className="material-symbols-outlined text-xs">chat</span>
                                </Link>
                              )}

                              <Link href={`/profile/${p.userId}`} className="w-full py-2.5 bg-stone-50 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all border border-stone-100">View Profile</Link>
                           </div>
                         </div>
                       </div>
                     ))}
                     

                     {loadingMore && [1,2,3,4].map(i => (
                        <div key={i} className="bg-white/50 rounded-[2rem] p-4 border border-white h-[450px] animate-pulse" />
                     ))}
                   </div>

                   {hasMore && !loading && !loadingMore && (
                     <div className="text-center py-20">
                        <button 
                          onClick={() => setPage(prev => prev + 1)} 
                          className="px-12 py-5 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
                        >
                          Load More Profiles <span className="material-symbols-outlined">expand_more</span>
                        </button>
                     </div>
                   )}
                 </div>
               )}
            </div>

          </div>
        </ProfileGate>
      </main>

      {/* MORE FILTERS MODAL */}
      {showMoreFilters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-md animate-fade-in" onClick={() => setShowMoreFilters(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-pop-in border border-rose-50">
            <div className="p-8 border-b border-rose-50 flex items-center justify-between bg-rose-50/30">
               <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">Advanced Filters</h2>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Refine your search for the perfect match</p>
               </div>
               <button onClick={() => setShowMoreFilters(false)} className="w-10 h-10 rounded-full bg-white border border-rose-100 flex items-center justify-center text-stone-400 hover:text-rose-500 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-xl">close</span>
               </button>
            </div>
            
            <div className="p-8 max-h-[70vh] overflow-y-auto hide-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Height Range (cm)</label>
                        <div className="flex items-center gap-4">
                           <input 
                             type="number" placeholder="Min" value={filters.minHeight} 
                             onChange={(e) => setFilters(prev => ({ ...prev, minHeight: parseInt(e.target.value) || 0 }))}
                             className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100"
                           />
                           <input 
                             type="number" placeholder="Max" value={filters.maxHeight} 
                             onChange={(e) => setFilters(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 0 }))}
                             className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100"
                           />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Education Level</label>
                        <input 
                          type="text" placeholder="e.g. MBA, B.Tech" value={filters.education} 
                          onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value }))}
                          className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Annual Income</label>
                        <select 
                          value={filters.incomeTier} onChange={(e) => setFilters(prev => ({ ...prev, incomeTier: e.target.value }))}
                          className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                        >
                           <option>All</option>
                           {['Below 5L', '5-10L', '10-20L', '20-50L', '50L+'].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Caste / Community</label>
                        <input 
                          type="text" placeholder="e.g. Brahmin, Jat" value={filters.caste} 
                          onChange={(e) => setFilters(prev => ({ ...prev, caste: e.target.value }))}
                          className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Profession</label>
                        <input 
                          type="text" placeholder="e.g. Doctor, Engineer" value={filters.profession} 
                          onChange={(e) => setFilters(prev => ({ ...prev, profession: e.target.value }))}
                          className="w-full bg-stone-50 border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Lifestyle Preferences</label>
                        <div className="flex flex-wrap gap-4 pt-2">
                           <button 
                             onClick={() => setFilters(prev => ({ ...prev, smoking: !prev.smoking }))}
                             className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${filters.smoking ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-rose-200'}`}
                           >
                              Non-Smoker
                           </button>
                           <button 
                             onClick={() => setFilters(prev => ({ ...prev, drinking: !prev.drinking }))}
                             className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${filters.drinking ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-rose-200'}`}
                           >
                              Non-Drinker
                           </button>
                           <button 
                             onClick={() => setFilters(prev => ({ ...prev, recentlyActive: !prev.recentlyActive }))}
                             className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${filters.recentlyActive ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-stone-400 border-stone-100 hover:border-rose-200'}`}
                           >
                              Recently Active
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-rose-50 flex items-center justify-between bg-stone-50/30">
               <button onClick={resetFilters} className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] hover:text-rose-500 transition-all">Clear All</button>
               <button 
                 onClick={() => { setPage(1); setShowMoreFilters(false); }}
                 className="px-10 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black hover:-translate-y-1 transition-all"
               >
                 Apply Advanced Filters
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
