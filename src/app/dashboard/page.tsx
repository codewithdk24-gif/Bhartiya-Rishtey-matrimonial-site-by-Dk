'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';
import { useModals } from '@/context/ModalContext';
import { useSession } from 'next-auth/react';
import { getProfileImage } from '@/lib/image';

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

const LiveInsightsCard = ({ stats }: { stats: any }) => {
  const insights = [
    { label: 'Matches', value: 12, icon: 'auto_awesome', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Views', value: stats?.profileViews || 0, icon: 'visibility', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Interests', value: stats?.interestsReceived || 0, icon: 'favorite', color: 'text-[#E11D48]', bg: 'bg-rose-50' },
  ];

  return (
    <div className="w-full lg:w-85 shrink-0 hidden lg:flex flex-col">
      {/* Desktop Full Card */}
      <div className="bg-gradient-to-br from-white to-[#F8F9FB] rounded-[2.5rem] p-10 shadow-sm md:shadow-md border border-[#ECECEC] flex flex-col relative overflow-hidden group hover:border-[#E11D48]/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
        <h4 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-[0.25em] mb-8 flex items-center gap-2 relative z-10">
          <span className="w-1.5 h-1.5 bg-[#E11D48] rounded-full animate-pulse" />
          Live Insights
        </h4>
        
        <div className="space-y-6 relative z-10">
          {insights.map((item, i) => (
            <div key={i} className="flex items-center justify-between group/item cursor-default">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center transition-all group-hover/item:scale-110 shadow-sm border border-white`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <span className="text-sm font-bold text-[#6B7280] tracking-tight group-hover/item:text-[#111827] transition-colors">{item.label}</span>
              </div>
              <span className="text-xl font-black text-[#111827]">
                <CountUp value={item.value} />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-[#ECECEC] relative z-10">
           <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest text-center">Last updated: Just now</p>
        </div>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openUpgradeModal } = useModals();
  
  const [summary, setSummary] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, activityRes, recsRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/activity/feed'),
        fetch('/api/recommendations')
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (activityRes.ok) setActivityFeed(await activityRes.json());
      if (recsRes.ok) setRecommendations(await recsRes.json());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoadingFeed(false);
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Desktop Ultra-Smooth Auto-Scroll Logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || loadingRecs || recommendations.length === 0) return;

    let animationId: number;
    let isHovered = false;
    let currentScroll = scrollContainer.scrollLeft || 0;

    // Initial position: Start in the middle set for seamlessness
    if (currentScroll === 0) {
      currentScroll = scrollContainer.scrollWidth / 3;
      scrollContainer.scrollLeft = currentScroll;
    }

    const animate = () => {
      if (!isHovered) {
        // Sub-pixel movement for maximum smoothness
        currentScroll += 0.75; 
        
        const oneThird = scrollContainer.scrollWidth / 3;
        const twoThirds = (scrollContainer.scrollWidth * 2) / 3;
        
        if (currentScroll >= twoThirds) {
          currentScroll = oneThird;
        }

        scrollContainer.scrollLeft = currentScroll;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleInteractionStart = () => { isHovered = true; };
    const handleInteractionEnd = () => { 
      isHovered = false; 
      // Sync currentScroll with actual position after manual interaction
      currentScroll = scrollContainer.scrollLeft;
    };

    scrollContainer.addEventListener('mouseenter', handleInteractionStart);
    scrollContainer.addEventListener('mouseleave', handleInteractionEnd);
    scrollContainer.addEventListener('touchstart', handleInteractionStart, { passive: true });
    scrollContainer.addEventListener('touchend', handleInteractionEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener('mouseenter', handleInteractionStart);
      scrollContainer.removeEventListener('mouseleave', handleInteractionEnd);
      scrollContainer.removeEventListener('touchstart', handleInteractionStart);
      scrollContainer.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [recommendations, loadingRecs]);

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  const userName = summary?.userName || session?.user?.name || 'User';
  const resolvedUserImage = getProfileImage(summary?.profile) || session?.user?.image;
  const completionPct = summary?.completionPct || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#F8F9FB] text-[#111827] selection:bg-rose-100">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* PREMIUM HERO SECTION */}
        <section className="mb-12 md:mb-20">
          <div className="bg-gradient-to-br from-white to-[#F8F9FB] rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-16 shadow-sm border border-[#ECECEC] flex flex-col lg:flex-row items-center gap-10 md:gap-16 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white rounded-full blur-[140px] -mr-80 -mt-80 opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
            
            <div className="flex-1 relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0">
                  <div className="absolute inset-0 bg-rose-200/30 rounded-full blur-2xl animate-pulse" />
                  <div className="relative w-full h-full rounded-full p-1.5 bg-white shadow-xl border border-[#ECECEC] transform hover:rotate-3 transition-transform duration-500 z-10">
                    <img src={resolvedUserImage || '/default-avatar.png'} alt={userName} className="w-full h-full object-cover rounded-full" />
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-7 h-7 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-[14px] text-white font-black">check</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-5xl lg:text-6xl font-headline font-black text-[#111827] leading-[1.2] md:leading-[1.1] tracking-tight">
                    Welcome back, <br className="hidden lg:block" />
                    <span className="text-[#E11D48]">{userName.split(' ')[0]}!</span>
                  </h1>
                </div>
              </div>
              
              <p className="text-[#6B7280] text-base md:text-xl font-medium mb-10 md:mb-12 max-w-xl leading-relaxed">
                {completionPct === 100 
                  ? "Your profile is fully optimized. Start exploring matches and find your special someone."
                  : <>Complete your profile to increase your match chances by <span className="text-[#E11D48] font-black">3x</span>. Your journey starts here.</>
                }
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-4 w-full md:w-auto">
                {completionPct < 100 ? (
                  <Link 
                    href="/profile/edit" 
                    className="w-full md:w-auto inline-flex items-center justify-center gap-4 px-8 md:px-12 py-4 md:py-5 bg-[#E11D48] text-white rounded-[2.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-[#BE123C] hover:scale-[1.05] transition-all shadow-2xl shadow-rose-200 active:scale-[0.98] group/btn"
                  >
                    Complete Profile
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">east</span>
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/discover" 
                      className="w-full md:w-auto inline-flex items-center justify-center gap-4 px-8 md:px-12 py-4 md:py-5 bg-[#E11D48] text-white rounded-[2.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-[#BE123C] hover:scale-[1.05] transition-all shadow-2xl shadow-rose-200 active:scale-[0.98] group/btn"
                    >
                      Discover Matches
                      <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">local_fire_department</span>
                    </Link>
                    <Link 
                      href="/profile" 
                      className="w-full md:w-auto inline-flex items-center justify-center gap-4 px-8 py-4 md:py-5 bg-white text-[#6B7280] rounded-[2.5rem] text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-[#F8F9FB] transition-all border border-[#E5E7EB] active:scale-[0.98]"
                    >
                      View Profile
                    </Link>
                  </>
                )}
              </div>
            </div>


          </div>
        </section>

        {/* GROUPED STATS GRID */}
        <div className="bg-[#F9FAFB] p-8 md:p-12 rounded-[3rem] mb-16 md:mb-20 border border-[#F0F1F3]">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-[12px] md:gap-8">
            {[
              { label: 'Interests', value: summary?.stats?.interestsReceived || 0, icon: 'favorite', color: 'text-[#E11D48]', bg: 'bg-rose-50' },
              { label: 'Matches', value: summary?.stats?.matches || 0, icon: 'handshake', color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Views', value: summary?.stats?.profileViews || 0, icon: 'visibility', color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Chats', value: 0, icon: 'chat_bubble', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className={`border p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] flex flex-col items-center text-center gap-3 md:gap-5 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-500 group cursor-pointer shadow-sm ${
                  stat.label === 'Matches' 
                    ? 'bg-rose-50/30 border-[#E11D48]/20 shadow-rose-100/50' 
                    : 'bg-white border-[#ECECEC]'
                }`}
              >
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-white shadow-sm`}>
                  <span className="material-symbols-outlined text-xl md:text-3xl">{stat.icon}</span>
                </div>
                <div>
                  <p className="text-xl md:text-3xl font-black text-[#111827] leading-none tracking-tighter">
                    <CountUp value={stat.value} />
                  </p>
                  <p className="text-[9px] md:text-[11px] font-black text-[#9CA3AF] uppercase tracking-widest mt-2.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* RECOMMENDED FOR YOU - FULL WIDTH SCROLLER */}
        <section className="mb-24 relative">
          <div className="flex items-center justify-between mb-12 px-2">
            <div>
              <h3 className="text-xl md:text-3xl font-headline font-black text-[#111827] tracking-tight">Recommended Matches</h3>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E11D48] rounded-full animate-pulse" />
                For You
              </p>
            </div>
            <Link href="/discover" className="text-[10px] font-black text-[#E11D48] hover:underline uppercase tracking-widest flex items-center gap-2 group">
               See all <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">east</span>
            </Link>
          </div>
          
          <div className="relative group/scroller">
            {/* Navigation Arrows */}
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
              className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-6 z-30 w-14 h-14 bg-white rounded-full shadow-2xl border border-[#ECECEC] items-center justify-center hidden lg:flex opacity-0 group-hover/scroller:opacity-100 group-hover/scroller:translate-x-0 transition-all duration-500 hover:bg-rose-50 hover:text-[#E11D48] active:scale-90"
            >
              <span className="material-symbols-outlined">west</span>
            </button>
            
            <button 
              onClick={() => scrollRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
              className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-6 z-30 w-14 h-14 bg-white rounded-full shadow-2xl border border-[#ECECEC] items-center justify-center hidden lg:flex opacity-0 group-hover/scroller:opacity-100 group-hover/scroller:translate-x-0 transition-all duration-500 hover:bg-rose-50 hover:text-[#E11D48] active:scale-90"
            >
              <span className="material-symbols-outlined">east</span>
            </button>

            <div 
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-proximity lg:snap-none gap-6 lg:gap-10 pb-10 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
            >
              {loadingRecs ? (
                [1, 2, 3, 4].map(i => <div key={i} className="h-[500px] w-[360px] shrink-0 bg-white rounded-[3rem] border border-[#ECECEC] animate-pulse" />)
              ) : recommendations.length === 0 ? (
                <div className="w-full text-center py-24 bg-white rounded-[3rem] border border-dashed border-[#ECECEC]">
                  <p className="text-[#9CA3AF] font-bold uppercase tracking-widest text-[11px]">Finding your perfect matches...</p>
                </div>
              ) : (
                [...recommendations, ...recommendations, ...recommendations].map((p, idx) => (
                  <div key={`${p.id}-${idx}`} className="snap-start w-[85%] md:w-[360px] shrink-0 bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 border border-[#ECECEC] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative">
                    <div className="absolute top-8 right-8 z-20">
                       <div className={`px-4 py-2 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-[#ECECEC] flex items-center gap-2 hover:scale-110 transition-transform ${idx === 0 ? 'border-amber-100 ring-4 ring-amber-50' : ''}`}>
                          {idx === 0 ? (
                            <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1 animate-bounce">workspace_premium</span>
                          ) : (
                            <span className="material-symbols-outlined text-[14px] text-emerald-500 fill-1">verified</span>
                          )}
                          <span className="text-[11px] font-black text-[#111827] uppercase tracking-widest">
                            {idx === 0 ? 'Best Match' : `${Math.floor(88 + Math.random() * 8)}% Match`}
                          </span>
                       </div>
                    </div>

                    <div className="flex flex-col gap-8 mb-10 relative z-10">
                      <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-inner bg-[#F8F9FB] relative">
                        {getProfileImage(p.profile) ? (
                          <img src={getProfileImage(p.profile)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                        ) : (
                          <img src="/default-avatar.png" alt={p.name} className="w-full h-full object-cover opacity-50" />
                        )}
                        <div className="absolute bottom-6 left-6 flex items-center gap-2.5 px-3.5 py-1.5 bg-[#111827]/40 backdrop-blur-md rounded-full border border-white/10">
                           <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                           <span className="text-[9px] font-black text-white uppercase tracking-widest">Active recently</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-2xl font-headline font-black text-[#111827] group-hover:text-[#E11D48] transition-colors">
                            {p.name}, {p.age}
                          </h4>
                          <span className="material-symbols-outlined text-[#ECECEC] group-hover:text-[#E11D48] transition-colors cursor-pointer active:scale-125">favorite</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{p.profession}</span>
                          <span className="w-1 h-1 bg-[#ECECEC] rounded-full" />
                          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            {p.location}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 relative z-10">
                      <button className="w-full py-4 md:py-5 bg-[#E11D48] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#BE123C] hover:shadow-lg hover:shadow-rose-500/30 transition-all shadow-xl shadow-rose-100 active:scale-95">
                         Send Interest
                      </button>
                      <Link href={`/profile/${p.id}`} className="w-full py-3 md:py-5 text-[#9CA3AF] hover:text-[#E11D48] text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center transition-all active:scale-95">
                         View Full Profile
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 text-center">
             <Link href="/discover" className="inline-flex items-center gap-6 px-12 py-5 bg-white border border-[#ECECEC] rounded-2xl text-[12px] font-black text-[#E11D48] uppercase tracking-[0.2em] hover:bg-[#E11D48] hover:text-white hover:shadow-2xl hover:shadow-rose-500/20 hover:gap-8 transition-all group shadow-sm">
                Explore More Matches
                <span className="material-symbols-outlined text-sm group-hover:translate-x-2 transition-transform">east</span>
             </Link>
          </div>
        </section>

        {/* DASHBOARD ENDING SECTION */}
        <section className="mt-24 pt-20 border-t border-[#ECECEC] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-stretch">
            
            {/* PREMIUM UPGRADE - PRIMARY */}
            <div className="bg-white border border-[#ECECEC] p-8 md:p-12 rounded-[3rem] shadow-sm relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between">
              <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-amber-50/50 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                   <div>
                      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 border border-amber-100 shadow-sm text-amber-600">
                        <span className="material-symbols-outlined text-3xl font-black">diamond</span>
                      </div>
                      <h3 className="text-3xl font-headline font-black text-[#111827] mb-4 tracking-tight">Premium Experience</h3>
                      <p className="text-[#6B7280] text-sm font-medium leading-relaxed max-w-md">
                        Upgrade to unlock the full potential of Bhartiya Rishtey and find your partner faster with exclusive features.
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                      {[
                        { label: '3x Profile Visibility', icon: 'visibility' },
                        { label: 'Direct Chat Access', icon: 'chat' },
                        { label: 'Priority Support', icon: 'support_agent' },
                        { label: 'Advanced Filters', icon: 'filter_list' },
                      ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-600">
                            <span className="material-symbols-outlined text-[14px] font-black">check</span>
                          </div>
                          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-tight">{benefit.label}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="mt-auto">
                   <button 
                     onClick={() => openUpgradeModal('dashboard_premium_footer', 'PRIME')}
                     className="w-full md:w-auto px-12 py-5 bg-[#111827] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-stone-200"
                   >
                     Become a Premium Member
                   </button>
                </div>
              </div>
            </div>

            {/* SMART AI SUMMARY - SECONDARY */}
            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-10 rounded-[3rem] shadow-xl relative overflow-hidden group border border-white/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col">
               <div className="absolute top-0 right-0 w-40 h-40 bg-[#E11D48]/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-10">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-[#E11D48] text-xl">psychology</span>
                     </div>
                     <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Smart Insights</h3>
                  </div>
                  
                  <div className="space-y-8 mb-12">
                     <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-emerald-400 text-lg">auto_awesome</span>
                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                           You have <span className="text-white font-black">12 new compatible matches</span> based on your interests.
                        </p>
                     </div>
                     <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined text-rose-400 text-lg">favorite</span>
                        <p className="text-white/70 text-sm font-medium leading-relaxed">
                           <span className="text-white font-black">3 profiles</span> have shown interest in the last 24 hours.
                        </p>
                     </div>
                  </div>

                  <div className="mt-auto">
                    <Link 
                      href="/discover" 
                      className="w-full py-5 bg-[#E11D48] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#BE123C] transition-all text-center block shadow-lg shadow-rose-900/20"
                    >
                      View Matches
                    </Link>
                  </div>
               </div>
            </div>

          </div>
        </section>
      </main>

    </div>
  );
}
