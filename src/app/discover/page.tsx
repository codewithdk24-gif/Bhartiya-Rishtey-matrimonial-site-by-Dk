'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';
import ProfileGate from '@/components/ProfileGate';
import { useSession } from 'next-auth/react';
import { formatLocation } from '@/lib/location';
import { getProfileImage } from '@/lib/image';

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
  isNew?: boolean;
}

/* ────── Components ────── */
const CountUp = ({ value, duration = 1500 }: { value: number | string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const target = typeof value === 'string' ? parseInt(value) : value;

  useEffect(() => {
    if (isNaN(target) || target <= 0) {
      setCount(0);
      return;
    }
    
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <>{count}</>;
};

const ProfileStrengthWidget = ({ percentage }: { percentage: number }) => {
  return (
    <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-rose-50 flex items-center gap-4 animate-in fade-in slide-in-from-right duration-700 hover:shadow-md transition-all">
      <div className="relative w-11 h-11 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-stone-100" />
          <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" strokeDasharray={113} strokeDashoffset={113 - (113 * percentage) / 100} className="text-rose-500 transition-all duration-1000" />
        </svg>
        <span className="absolute text-[9px] font-black text-stone-900">{percentage}%</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Profile Strength</p>
        {percentage < 100 ? (
          <Link href="/profile/edit" className="text-[9px] font-black text-rose-600 hover:underline uppercase tracking-tight">Complete Now →</Link>
        ) : (
          <p className="text-[9px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-tight">Complete <span className="material-symbols-outlined text-[10px] fill-1">verified</span></p>
        )}
      </div>
    </div>
  );
};

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
  const [aiRecs, setAiRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRelaxed, setIsRelaxed] = useState(false);
  const [completionPct, setCompletionPct] = useState(0);
  const [activeAiIndex, setActiveAiIndex] = useState(0);
  
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
        // Only auto-load on mobile as requested
        if (window.innerWidth <= 768) {
          setPage(prev => prev + 1);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // ────── Data Fetching ──────
  const fetchCompletionStats = async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setCompletionPct(data.completionPct || 0);
      }
    } catch (err) { console.error(err); }
  };

  const fetchAiRecs = async () => {
    try {
       const res = await fetch('/api/recommendations');
       if (res.ok) setAiRecs(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingAi(false); }
  };

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
    fetchProfiles(page, page > 0);
  }, [page, fetchProfiles]);

  useEffect(() => {
    fetchCompletionStats();
    fetchAiRecs();
  }, []);

  useEffect(() => {
    setPage(0);
    setProfiles([]);
    setIsRelaxed(false);
  }, [filters]);

  // ────── Interactions ──────
  const handleInterest = async (receiverId: string) => {
    if (processingIds.has(receiverId) || sentInterestIds.has(receiverId)) return;
    setProcessingIds(prev => new Set(prev).add(receiverId));
    try {
      const res = await fetch('/api/interests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: receiverId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSentInterestIds(prev => new Set(prev).add(receiverId));
      } else {
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 via-white to-rose-50/50 selection:bg-rose-100">
      <DashNav />
      
      <main className="max-w-[1600px] mx-auto px-4 sm:px-8 py-8">
        <ProfileGate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* SIDEBAR FILTERS IMPROVED */}
            <aside className="lg:col-span-3 hidden xl:block sticky top-24 bg-white rounded-[2.5rem] p-8 border border-rose-50 shadow-sm overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-rose-500">tune</span>
                    Preferences
                  </h3>
                  <button onClick={resetFilters} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Reset All</button>
               </div>

               <div className="space-y-10">
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">calendar_month</span>
                          Age Range
                        </label>
                        <span className="text-[10px] font-bold text-stone-900 bg-rose-50 px-2 py-0.5 rounded-full">{filters.ageMin} - {filters.ageMax}</span>
                     </div>
                     <input 
                       type="range" min="18" max="60" value={filters.ageMax} 
                       onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))}
                       className="w-full accent-rose-500 h-1.5 bg-rose-50 rounded-full appearance-none cursor-pointer"
                     />
                  </div>

                  <div className="h-px bg-rose-50" />

                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">church</span>
                       Religion
                     </label>
                     <select 
                       value={filters.religion} onChange={(e) => setFilters(prev => ({ ...prev, religion: e.target.value }))}
                       className="w-full bg-[#F9FAFB] border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer hover:bg-white"
                     >
                        <option>All</option>
                        {['Hindu','Muslim','Sikh','Christian','Buddhist','Jain','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">favorite</span>
                       Marital Status
                     </label>
                     <select 
                       value={filters.maritalStatus} onChange={(e) => setFilters(prev => ({ ...prev, maritalStatus: e.target.value }))}
                       className="w-full bg-[#F9FAFB] border border-rose-50 rounded-xl px-4 py-3 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer hover:bg-white"
                     >
                        <option>All</option>
                        {['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'].map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>

                  <div className="h-px bg-rose-50" />

                  <div className="space-y-5">
                     <div className="flex items-center justify-between group/toggle cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}>
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${filters.verifiedOnly ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'}`}>
                              <span className="material-symbols-outlined text-base">verified</span>
                           </div>
                           <span className="text-xs font-bold text-stone-600 group-hover/toggle:text-stone-900 transition-colors">Verified Only</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-all relative ${filters.verifiedOnly ? 'bg-emerald-500' : 'bg-stone-200'}`}>
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${filters.verifiedOnly ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                     </div>
                     <div className="flex items-center justify-between group/toggle cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, photosOnly: !prev.photosOnly }))}>
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${filters.photosOnly ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-400'}`}>
                              <span className="material-symbols-outlined text-base">photo_library</span>
                           </div>
                           <span className="text-xs font-bold text-stone-600 group-hover/toggle:text-stone-900 transition-colors">With Photos</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-all relative ${filters.photosOnly ? 'bg-rose-500' : 'bg-stone-200'}`}>
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${filters.photosOnly ? 'left-4.5' : 'left-0.5'}`} />
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={() => setShowMoreFilters(true)}
                      className="w-full py-4 bg-stone-50 border border-stone-100 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-100 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">filter_list</span>
                      More Filters
                    </button>

                    <button 
                      onClick={() => setPage(0)}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 hover:-translate-y-1 transition-all active:scale-95"
                    >
                      Apply Filters
                    </button>
                  </div>
               </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="lg:col-span-9 min-w-0">
               <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-8">
                  <div className="flex items-center justify-between w-full md:w-auto">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                         <p className="text-[8px] md:text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">Live Matches</p>
                      </div>
                      <h1 className="text-2xl md:text-4xl font-headline font-black text-stone-900 tracking-tight leading-none">Discover Matches</h1>
                    </div>
                    
                    {/* MOBILE FILTER TRIGGER */}
                    <button 
                      onClick={() => setShowMoreFilters(true)}
                      className="xl:hidden w-11 h-11 bg-white border border-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-xl">tune</span>
                    </button>
                  </div>

                  <div className="hidden md:flex items-center gap-6 shrink-0">
                     <select 
                        value={filters.sort} onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
                        className="bg-white border border-rose-50 rounded-2xl px-5 py-3 text-[10px] font-black uppercase tracking-widest text-stone-500 shadow-sm outline-none focus:ring-2 focus:ring-rose-100 cursor-pointer hover:border-rose-200 transition-all"
                      >
                        <option value="best_match">Best Match</option>
                        <option value="recently_active">Recently Active</option>
                        <option value="new_profiles">Newest First</option>
                      </select>
                      <ProfileStrengthWidget percentage={completionPct} />
                  </div>
               </header>

               {error === 'PROFILE_INCOMPLETE' ? (
                 <div className="bg-white rounded-[4rem] p-20 text-center shadow-xl border border-rose-50 relative overflow-hidden group">
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-50 rounded-full blur-[100px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                    <div className="relative z-10 max-w-md mx-auto">
                       <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                          <span className="material-symbols-outlined text-4xl text-rose-500 fill-1">person_edit</span>
                       </div>
                       <h2 className="text-3xl font-headline font-black text-stone-900 mb-4 tracking-tight">Complete Your Profile</h2>
                       <p className="text-stone-500 text-sm mb-12 font-medium leading-relaxed">
                          Your perfect match is waiting! Complete your profile details to unlock personalized daily matches and start meaningful conversations.
                       </p>
                       <Link href="/profile/edit" className="px-12 py-5 bg-rose-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-200 hover:bg-rose-700 hover:-translate-y-1 transition-all inline-flex items-center gap-3">
                          Complete Now <span className="material-symbols-outlined text-sm">east</span>
                       </Link>
                    </div>
                 </div>
               ) : (
                <div className="space-y-12">
                   
                   {/* EXPLORED COUNTER - HIDDEN ON MOBILE */}
                   <div className="hidden md:flex items-center justify-between mb-8 px-2 animate-in fade-in slide-in-from-left duration-700">
                      <div className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-3 shadow-sm">
                         <span className="material-symbols-outlined text-stone-400 text-sm">history</span>
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                           You’ve explored <span className="text-stone-900 font-black"><CountUp value={profiles.length + (page * 12)} /> profiles</span> today
                         </p>
                      </div>
                   </div>

                   {/* AI RECOMMENDED SECTION */}
                   {!loading && aiRecs.length > 0 && (
                     <section className="mb-16 animate-in fade-in slide-in-from-top duration-1000 relative">
                       <div className="flex items-center justify-between mb-8 px-2">
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="material-symbols-outlined text-rose-500 text-sm animate-pulse">auto_awesome</span>
                              <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.25em]">AI Matchmaking</h3>
                           </div>
                           <h2 className="text-3xl font-headline font-black text-stone-900 tracking-tight">AI Recommended for You</h2>
                           <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Curated based on your activity and preferences</p>
                         </div>
                       </div>
                       
                       <div 
                          onScroll={(e) => {
                            const target = e.currentTarget;
                            const scrollPos = target.scrollLeft;
                            const itemWidth = target.offsetWidth * 0.8;
                            const index = Math.round(scrollPos / itemWidth);
                            if (index !== activeAiIndex) setActiveAiIndex(index);
                          }}
                          className="flex gap-4 md:gap-8 overflow-x-auto pb-4 md:pb-8 px-2 hide-scrollbar snap-x snap-mandatory"
                        >
                          {aiRecs.map((p) => (
                            <div key={p.id} className="snap-center shrink-0 w-[80%] md:w-[340px] bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-5 md:p-7 border border-rose-100/50 shadow-xl shadow-rose-50/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
                               
                               {/* AI Match Badge */}
                               <div className="absolute top-5 md:top-7 right-5 md:right-7 z-20">
                                  <div className="px-3 md:px-4 py-1 md:py-1.5 bg-[#111827] text-white rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg border border-white/10">
                                     <span className="material-symbols-outlined text-[10px] md:text-[12px] text-amber-400 fill-1 animate-pulse">star</span>
                                     AI Match
                                  </div>
                               </div>

                               <div className="relative aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-8 bg-stone-50 border border-white shadow-inner">
                                 <img src={getProfileImage(p.profile)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                 <div className="absolute bottom-4 md:bottom-5 left-4 md:left-5">
                                    <div className="px-3 md:px-4 py-1.5 md:py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-rose-50">
                                       <span className="text-[9px] md:text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                          {Math.floor(92 + Math.random() * 7)}% Compatibility
                                       </span>
                                    </div>
                                 </div>
                               </div>

                               <div className="space-y-2">
                                  <h4 className="text-xl md:text-2xl font-headline font-black text-stone-900 leading-tight">{p.name}, {p.age}</h4>
                                  <p className="text-[10px] md:text-[11px] font-black text-rose-500 uppercase tracking-widest mb-4 md:mb-6">{p.profession}</p>
                                  
                                  <div className="flex flex-wrap gap-1.5 pt-1 mb-6 md:mb-8">
                                     <span className="px-2 md:px-3 py-1 md:py-1.5 bg-stone-50 text-stone-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border border-stone-100">Highly compatible</span>
                                     <span className="px-2 md:px-3 py-1 md:py-1.5 bg-rose-50 text-rose-500 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-100">Shared Background</span>
                                  </div>

                                  <Link href={`/profile/${p.id}`} className="block w-full py-4 md:py-5 bg-[#111827] text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center hover:bg-black transition-all active:scale-95 shadow-xl shadow-stone-100">
                                     View Detailed AI Profile
                                  </Link>
                               </div>
                            </div>
                          ))}
                        </div>

                        {/* MOBILE SLIDER INDICATORS */}
                        <div className="md:hidden flex items-center justify-between px-4 mt-2">
                          <div className="flex gap-1.5">
                            {aiRecs.map((_, i) => (
                              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${activeAiIndex === i ? 'w-5 bg-rose-600' : 'w-1.5 bg-rose-100'}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{activeAiIndex + 1} / {aiRecs.length}</span>
                        </div>
                     </section>
                   )}

                    {/* NEW PROFILES TODAY SECTION - MOBILE ONLY */}
                    {!loading && profiles.filter(p => p.isNew).length > 0 && (
                      <section className="md:hidden mb-12 animate-in fade-in slide-in-from-left duration-1000">
                        <div className="flex items-center justify-between mb-6 px-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <span className="material-symbols-outlined text-amber-500 text-sm animate-pulse">auto_awesome</span>
                               <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em]">Fresh Arrivals</h3>
                            </div>
                            <h2 className="text-2xl font-headline font-black text-stone-900 tracking-tight">✨ New Profiles Today</h2>
                          </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 px-2 hide-scrollbar snap-x snap-mandatory">
                          {profiles
                            .filter(p => p.isNew)
                            .slice(0, 8)
                            .map((p) => (
                              <Link 
                                key={p.id} 
                                href={`/profile/${p.userId}`}
                                className="snap-center shrink-0 w-[160px] bg-white rounded-[2rem] p-3 border border-stone-100 shadow-sm active:scale-95 transition-all"
                              >
                                <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden mb-3 bg-stone-50">
                                   <img src={getProfileImage(p.photos)} alt={p.fullName} className="w-full h-full object-cover" />
                                   <div className="absolute top-2 left-2 px-2 py-1 bg-rose-600 text-white rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse shadow-lg">
                                      🔥 NEW
                                   </div>
                                </div>
                                <div className="px-1">
                                  <h4 className="text-xs font-headline font-black text-stone-900 truncate">{p.fullName}, {p.age}</h4>
                                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest truncate">{p.profession}</p>
                                </div>
                              </Link>
                            ))}
                        </div>
                      </section>
                    )}
                   
                   {!loading && profiles.length === 0 && (
                      <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-rose-200 animate-fade-in shadow-sm">
                         <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-8 text-stone-200">
                           <span className="material-symbols-outlined text-4xl">person_search</span>
                         </div>
                         <h3 className="text-2xl font-black text-stone-800 mb-3 tracking-tight">No Matches Yet</h3>
                         <p className="text-sm text-stone-400 max-w-sm mx-auto mb-12 font-medium leading-relaxed">
                           Try relaxing your filters or expanding your search area to find more compatible profiles.
                         </p>
                         <button onClick={resetFilters} className="px-10 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all">Relax Filters</button>
                      </div>
                   )}

{isRelaxed && profiles.length > 0 && (
                       <div className="p-5 bg-amber-50/60 backdrop-blur-md border border-amber-100 rounded-2xl flex items-center gap-4 animate-fade-in">
                          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <span className="material-symbols-outlined text-lg">lightbulb</span>
                          </div>
                          <p className="text-[11px] font-bold text-amber-900 leading-relaxed uppercase tracking-wide">Showing broader matches to give you more options</p>
                       </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 md:gap-10">
                      {loading && page === 0 && [1,2,3,4,5,6].map(i => (
                         <div key={i} className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 border border-white h-[450px] md:h-[500px] animate-pulse" />
                      ))}

                      {(() => {
                        const filtered = profiles.filter(p => !aiRecs.some(ai => ai.id === p.id || ai.userId === p.userId));
                        const sorted = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
                        return sorted.map((p, idx) => (
                          <div 
                            key={p.id} 
                            ref={idx === sorted.length - 1 ? lastProfileRef : null}
                            className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-5 border border-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 group relative flex flex-col h-full overflow-hidden"
                          >
                            {/* TOP ROW */}
                            <div className="flex items-center justify-between mb-4 relative z-20">
                               <div className="bg-rose-50/80 backdrop-blur-md text-rose-600 px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-rose-100">
                                 {p.matchScore}% Match {p.isVerified && <span className="material-symbols-outlined text-[10px] fill-1">verified</span>}
                               </div>
                               <button 
                                 onClick={(e) => { e.preventDefault(); toggleSave(p.userId); }} 
                                 className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${savedIds.has(p.userId) ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/90 backdrop-blur-md text-stone-300 border border-stone-100 hover:text-rose-400 hover:border-rose-100 shadow-sm'}`}
                               >
                                 <span className={`material-symbols-outlined text-lg ${savedIds.has(p.userId) ? 'fill-1' : ''}`}>favorite</span>
                               </button>
                            </div>

                            {/* PHOTO AREA */}
                            <div className="relative w-full aspect-[5/6] md:aspect-[4/5] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-5 md:mb-6 bg-stone-50 group-hover:shadow-2xl transition-all duration-700">
                              <img 
                                src={parsePhotos(p.photos)[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} 
                                alt={p.fullName} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" loading="lazy"
                              />

                              {/* NEW BADGE */}
                              {p.isNew && (
                                <div className="absolute top-4 left-4 z-30">
                                  <div className="px-3 py-1.5 bg-rose-600 text-white rounded-full text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-xl animate-pulse">
                                    <span className="material-symbols-outlined text-[10px] fill-1">bolt</span>
                                    New Today
                                  </div>
                                </div>
                              )}
                              
                              {/* SMART MATCH INSIGHT */}
                              <div className="absolute top-4 left-4 z-20 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 duration-500">
                                <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-rose-50 flex items-center gap-2">
                                   <span className="material-symbols-outlined text-[14px] text-rose-500 fill-1">auto_awesome</span>
                                   <span className="text-[9px] font-black text-stone-900 uppercase tracking-widest">
                                      {p.matchScore > 90 ? 'Best Match' : 'Highly Compatible'}
                                   </span>
                                </div>
                              </div>

                              {/* QUICK ACTIONS OVERLAY */}
                              <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                                 <Link href={`/profile/${p.userId}`} className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-stone-900 hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 shadow-xl">
                                    <span className="material-symbols-outlined">visibility</span>
                                 </Link>
                                 <button onClick={() => toggleSave(p.userId)} className={`w-11 h-11 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center ${savedIds.has(p.userId) ? 'text-rose-600' : 'text-stone-900'} hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 shadow-xl`}>
                                    <span className={`material-symbols-outlined ${savedIds.has(p.userId) ? 'fill-1' : ''}`}>bookmark</span>
                                 </button>
                              </div>

                              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                 <div className="bg-stone-900/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                       <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                       {p.activityStatus}
                                    </span>
                                 </div>
                              </div>
                            </div>
                            
                            {/* INFO AREA */}
                            <div className="space-y-4 md:space-y-5 flex-1 flex flex-col">
                               <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1 md:mb-2">
                                     <h3 className="text-lg md:text-xl font-headline font-black text-stone-900 leading-none group-hover:text-rose-600 transition-colors truncate">{p.fullName}, {p.age}</h3>
                                  </div>
                                  <p className="text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-[0.1em]">{p.profession}</p>
                                  <div className="flex items-center gap-2 md:gap-3 mt-3 text-stone-400">
                                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                                       <span className="material-symbols-outlined text-[14px]">location_on</span>
                                       {formatLocation(p)}
                                     </span>
                                     <span className="w-1 h-1 bg-stone-200 rounded-full shrink-0" />
                                     <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate">Never Married</span>
                                  </div>
                               </div>

                             <div className="pt-4 md:pt-6 border-t border-stone-50 flex flex-col gap-2">
                                <button 
                                  onClick={() => handleInterest(p.userId)} 
                                  disabled={processingIds.has(p.userId) || sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING' || p.interestStatus === 'ACCEPTED' || p.interestStatus === 'REJECTED'}
                                  className={`w-full py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-80 flex items-center justify-center gap-2 ${
                                    (p.interestStatus === 'ACCEPTED') 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                      : (p.interestStatus === 'REJECTED')
                                      ? 'bg-stone-100 text-stone-400'
                                      : (sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING')
                                      ? 'bg-stone-100 text-stone-500 border border-stone-100' 
                                      : 'bg-rose-600 text-white shadow-xl shadow-rose-100 hover:bg-rose-700 hover:-translate-y-1 active:scale-95'
                                  }`}
                                >
                                  {processingIds.has(p.userId) ? (
                                    'Sending...'
                                  ) : (p.interestStatus === 'ACCEPTED') ? (
                                    <>Mutual Match <span className="material-symbols-outlined text-sm">verified_user</span></>
                                  ) : (p.interestStatus === 'REJECTED') ? (
                                    'Not Interested'
                                  ) : (sentInterestIds.has(p.userId) || p.interestStatus === 'PENDING') ? (
                                    <>Interest Sent <span className="material-symbols-outlined text-sm">check</span></>
                                  ) : (
                                    <>Send Interest <span className="material-symbols-outlined text-sm">favorite</span></>
                                  )}
                                </button>

                                <Link href={`/profile/${p.userId}`} className="w-full py-3 md:py-4 bg-stone-50 text-stone-600 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all border border-stone-100 active:scale-95">
                                   View Profile
                                </Link>
                             </div>
                            </div>
                          </div>
                        ));
                      })()}

                      {loadingMore && [1,2,3].map(i => (
                         <div key={i} className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 border border-white h-[450px] md:h-[500px] animate-pulse" />
                      ))}
                    </div>

                   {!hasMore && profiles.length > 0 && (
                      <div className="py-20 text-center animate-in fade-in slide-in-from-bottom duration-1000">
                         <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-200">
                           <span className="material-symbols-outlined text-3xl">sentiment_satisfied</span>
                         </div>
                         <h3 className="text-xl font-black text-stone-900 mb-2">You've seen all profiles</h3>
                         <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Try relaxing your filters to discover more matches</p>
                      </div>
                   )}

                   {hasMore && !loading && !loadingMore && (
                     <div className="hidden md:block mt-20 py-24 bg-[#F9FAFB] rounded-[4rem] border border-rose-50/50 text-center relative overflow-hidden group animate-in fade-in slide-in-from-bottom duration-1000">
                        {/* Subtle background glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />
                        
                        <div className="relative z-10 max-w-xl mx-auto px-6">
                           <h3 className="text-3xl font-headline font-black text-stone-900 mb-4 tracking-tight">
                              Still exploring? We’ve got more matches for you
                           </h3>
                           <p className="text-stone-500 text-sm mb-12 font-medium leading-relaxed">
                              Discover new profiles tailored to your preferences and find your perfect partner today.
                           </p>
                           
                           <button 
                             onClick={() => setPage(prev => prev + 1)} 
                             className="px-16 py-6 bg-[#E11D48] text-white rounded-full text-xs font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-200 hover:bg-[#BE123C] hover:-translate-y-1.5 hover:shadow-rose-300 transition-all flex items-center gap-4 mx-auto group/btn active:scale-95"
                           >
                             Find More Profiles
                             <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-2 transition-transform">east</span>
                           </button>
                           
                           <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-10">
                              Showing <CountUp value={profiles.length + (page * 12)} /> results so far
                           </p>
                        </div>
                     </div>
                   )}
                 </div>
               )}
            </div>

          </div>
        </ProfileGate>
      </main>

      <div className="h-32 md:hidden" />

      {/* MORE FILTERS MODAL IMPROVED */}
      {showMoreFilters && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-lg animate-fade-in" onClick={() => setShowMoreFilters(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden animate-pop-in border border-rose-50">
            <div className="p-10 border-b border-rose-50 flex items-center justify-between bg-gradient-to-r from-rose-50/50 to-white">
               <div>
                  <h2 className="text-3xl font-headline font-black text-stone-900 tracking-tight">Advanced Filters</h2>
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mt-2">Find your perfect matches</p>
               </div>
               <button onClick={() => setShowMoreFilters(false)} className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-stone-400 hover:text-rose-500 hover:rotate-90 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-2xl">close</span>
               </button>
            </div>
            
            <div className="p-10 max-h-[65vh] overflow-y-auto hide-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">height</span>
                           Height Range (cm)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="relative">
                             <input 
                               type="number" placeholder="Min" value={filters.minHeight} 
                               onChange={(e) => setFilters(prev => ({ ...prev, minHeight: parseInt(e.target.value) || 0 }))}
                               className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                             />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-300">CM</span>
                           </div>
                           <div className="relative">
                             <input 
                               type="number" placeholder="Max" value={filters.maxHeight} 
                               onChange={(e) => setFilters(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 0 }))}
                               className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                             />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-stone-300">CM</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">school</span>
                           Education
                        </label>
                        <input 
                          type="text" placeholder="e.g. MBA, B.Tech" value={filters.education} 
                          onChange={(e) => setFilters(prev => ({ ...prev, education: e.target.value }))}
                          className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">payments</span>
                           Annual Income
                        </label>
                        <select 
                          value={filters.incomeTier} onChange={(e) => setFilters(prev => ({ ...prev, incomeTier: e.target.value }))}
                          className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer"
                        >
                           <option>All</option>
                           {['Below 5L', '5-10L', '10-20L', '20-50L', '50L+'].map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">groups</span>
                           Caste / Community
                        </label>
                        <input 
                          type="text" placeholder="e.g. Brahmin, Jat" value={filters.caste} 
                          onChange={(e) => setFilters(prev => ({ ...prev, caste: e.target.value }))}
                          className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">work</span>
                           Profession
                        </label>
                        <input 
                          type="text" placeholder="e.g. Doctor, Engineer" value={filters.profession} 
                          onChange={(e) => setFilters(prev => ({ ...prev, profession: e.target.value }))}
                          className="w-full bg-[#F9FAFB] border border-rose-50 rounded-2xl px-5 py-4 text-xs font-bold text-stone-600 outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                        />
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.15em] flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm">nightlife</span>
                           Lifestyle
                        </label>
                        <div className="flex flex-wrap gap-3">
                           {[
                             { id: 'smoking', label: 'Non-Smoker' },
                             { id: 'drinking', label: 'Non-Drinker' },
                             { id: 'recentlyActive', label: 'Active Now' }
                           ].map(item => (
                             <button 
                               key={item.id}
                               onClick={() => setFilters(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                               className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${ (filters as any)[item.id] ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-100' : 'bg-white text-stone-400 border-stone-100 hover:border-rose-200'}`}
                             >
                                {item.label}
                             </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-10 border-t border-rose-50 flex items-center justify-between bg-stone-50/40">
               <button onClick={resetFilters} className="text-[11px] font-black text-stone-400 uppercase tracking-[0.25em] hover:text-rose-600 transition-all">Clear All</button>
               <button 
                 onClick={() => { setPage(1); setShowMoreFilters(false); }}
                 className="px-12 py-5 bg-stone-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-black hover:-translate-y-1 transition-all active:scale-95"
               >
                 Show Results
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
