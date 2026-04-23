'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';
import { useModals } from '@/context/ModalContext';
import { useSession } from 'next-auth/react';
import { getProfileImage } from '@/lib/image';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openUpgradeModal } = useModals();
  
  const [summary, setSummary] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  console.log("User profile:", summary?.profile);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-rose-50/30 selection:bg-rose-100 transition-all duration-500">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        
        {/* HEADER SECTION WITH PROGRESS */}
        <section className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-rose-100/50 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-40 group-hover:opacity-60 transition-opacity" />
            
            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
              <div className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-2xl overflow-hidden bg-rose-100 flex items-center justify-center ring-4 ring-rose-50 flex-shrink-0">
                {resolvedUserImage ? (
                  <img src={resolvedUserImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <img src="/default-avatar.png" alt={userName} className="w-full h-full object-cover opacity-50" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-stone-900 leading-tight mb-2 tracking-tight">
                  Hi, {userName.split(' ')[0]}! 👋
                </h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">Active Now</span>
                  <span className="text-xs font-bold text-stone-400">Welcome back to your dashboard</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 relative z-10 bg-rose-50/50 p-5 rounded-3xl border border-rose-100/50">
               <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Profile Strength</p>
                  <p className="text-xs font-black text-rose-600">{completionPct}%</p>
               </div>
               <div className="h-2 bg-white rounded-full overflow-hidden border border-rose-100">
                  <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${completionPct}%` }} />
               </div>
               <Link href="/profile/edit" className="block text-center mt-3 text-[10px] font-black text-rose-600 hover:underline uppercase tracking-widest">Complete Now →</Link>
            </div>
          </div>

          <div className="lg:col-span-4 bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[40px] -mr-16 -mt-16" />
            <div className="relative z-10">
              <h3 className="text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Pending Actions</h3>
              {summary?.stats?.interestsReceived > 0 ? (
                <div className="space-y-4">
                  <p className="text-white text-lg font-bold leading-tight">
                    <span className="text-3xl mr-2">💌</span><br />
                    <span className="text-rose-400">{summary.stats.interestsReceived} {summary.stats.interestsReceived === 1 ? 'person is' : 'people are'}</span> waiting for your response!
                  </p>
                  <p className="text-stone-400 text-xs">Don't keep them waiting — show some love!</p>
                  <Link href="/matches?tab=requests" className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/40">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    Review Requests
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-4xl">🎉</p>
                  <p className="text-white text-lg font-bold">You&apos;re all caught up!</p>
                  <p className="text-stone-400 text-sm">No pending requests right now. Keep exploring!</p>
                  <Link href="/discover" className="inline-flex items-center gap-2 px-6 py-3 bg-stone-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-600 transition-all mt-2">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    Discover Profiles
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="mb-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Interests Received', value: summary?.stats?.interestsReceived || 0, icon: 'favorite', color: 'text-rose-600', bg: 'bg-rose-50', link: '/matches?tab=requests' },
            { label: 'Interests Sent', value: summary?.stats?.interestsSent || 0, icon: 'send', color: 'text-blue-600', bg: 'bg-blue-50', link: '/matches?tab=sent' },
            { label: 'Total Matches', value: summary?.stats?.matches || 0, icon: 'handshake', color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/matches?tab=matched' },
            { label: 'Profile Views', value: summary?.stats?.profileViews || 0, icon: 'visibility', color: 'text-amber-500', bg: 'bg-amber-50', link: '/profile/views' },
          ].map((stat, i) => (
            <Link key={i} href={stat.link} className="bg-white border border-rose-50 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-black text-stone-900 leading-none">{stat.value}</p>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-3">{stat.label}</p>
            </Link>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* RECOMMENDED FOR YOU */}
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                   Recommended for You
                </h3>
                <Link href="/discover" className="text-[10px] font-black text-rose-600 hover:underline uppercase tracking-widest flex items-center gap-1">
                  See More <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loadingRecs ? (
                  [1, 2].map(i => <div key={i} className="h-48 bg-stone-100 rounded-[2.5rem] animate-pulse" />)
                ) : recommendations.length === 0 ? (
                  <div className="md:col-span-2 text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-stone-200">
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Finding matches for you...</p>
                  </div>
                ) : (
                  recommendations.map((p) => (
                    <div key={p.id} className="bg-white rounded-[2.5rem] p-6 border border-rose-50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                      <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-xl bg-stone-50 shrink-0 group-hover:rotate-3 transition-transform duration-500">
                          {getProfileImage(p.profile) ? (
                            <img src={getProfileImage(p.profile)} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <img src="/default-avatar.png" alt={p.name} className="w-full h-full object-cover opacity-50" />
                          )}
                        </div>
                        <div className="truncate">
                          <h4 className="text-lg font-black text-stone-900 truncate flex items-center gap-2">
                            {p.name}, {p.age}
                            {p.isVerified && <span className="material-symbols-outlined text-rose-500 text-sm fill-1">verified</span>}
                          </h4>
                          <p className="text-[11px] font-bold text-rose-500 truncate mt-1 uppercase tracking-wider">{p.profession}</p>
                          <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {p.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 relative z-10">
                        <Link href={`/profile/${p.id}`} className="flex-1 py-3.5 bg-stone-50 text-stone-600 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all border border-stone-100">View Profile</Link>
                        <button className="flex-[1.5] py-3.5 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">Send Interest</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* RECENT ACTIVITY FEED */}
            <section>
              <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                   Recent Activity
                </h3>
              </div>
              
              <div className="bg-white rounded-[2.5rem] border border-stone-50 shadow-sm overflow-hidden">
                {loadingFeed ? (
                  <div className="p-10 space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-stone-50 rounded-2xl animate-pulse" />)}
                  </div>
                ) : activityFeed.length === 0 ? (
                  <div className="text-center py-20">
                    <span className="material-symbols-outlined text-4xl text-stone-200 mb-4">notifications_off</span>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No activity yet. Start exploring!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {activityFeed.map((activity) => (
                      <Link key={activity.id} href={activity.type === 'interest_accepted' ? `/chat` : `/profile/${activity.userId}`} className="flex items-center gap-5 p-6 hover:bg-stone-50 transition-all group">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 shadow-sm">
                           {getProfileImage(activity.profile) ? (
                             <img src={getProfileImage(activity.profile)} alt={activity.userName} className="w-full h-full object-cover" />
                           ) : (
                             <img src="/default-avatar.png" alt={activity.userName} className="w-full h-full object-cover opacity-50" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-700 group-hover:text-rose-600 transition-colors">
                            {activity.text}
                          </p>
                          <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-1.5">{getTimeAgo(activity.timestamp)}</p>
                        </div>
                        <span className="material-symbols-outlined text-stone-200 group-hover:text-rose-300 transition-colors">chevron_right</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* LIVE PULSE SECTION */}
            <div className="bg-white border border-stone-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
              <div className="absolute top-4 right-8">
                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
              </div>
              <h3 className="text-[10px] font-black text-stone-900 mb-8 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-1 h-4 bg-rose-500 rounded-full" />
                Live Pulse
              </h3>
              <div className="space-y-8">
                {activityFeed.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex gap-4 items-start group/pulse">
                    <div className="w-1 h-1 rounded-full bg-stone-300 mt-1.5 group-hover/pulse:bg-rose-500 group-hover/pulse:scale-150 transition-all" />
                    <div>
                      <p className="text-[11px] text-stone-600 leading-tight font-medium group-hover/pulse:text-stone-900 transition-colors">{a.text}</p>
                      <p className="text-[8px] text-stone-300 font-bold uppercase mt-1 tracking-widest">{getTimeAgo(a.timestamp)}</p>
                    </div>
                  </div>
                ))}
                {activityFeed.length === 0 && (
                   <p className="text-[10px] text-stone-400 font-medium italic">Waiting for the first heartbeat...</p>
                )}
              </div>
            </div>

            {/* UPGRADE TEASER */}
            <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200/20 rounded-full blur-3xl" />
              <h3 className="text-[10px] font-black text-amber-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-xl text-amber-500">workspace_premium</span>
                Premium Member
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-8 font-medium">
                Profiles with **Premium Badges** get **3x more interest** and appear at the top of searches.
              </p>
              <button onClick={() => openUpgradeModal('unlimited_profiles', 'PRIME')} className="w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-600 transition-all shadow-xl shadow-amber-200/50">Unlock Premium</button>
            </div>

            {/* SAFETY TIP */}
            <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-rose-500/10 rounded-full blur-[100px]" />
               <div className="relative z-10">
                 <h3 className="text-lg font-black mb-4 flex items-center gap-3 text-rose-500">
                   <span className="material-symbols-outlined text-2xl">verified_user</span>
                   Secure
                 </h3>
                 <p className="text-stone-400 text-xs font-medium leading-relaxed mb-10">
                   We use manual verification for every profile. Always look for the verified badge!
                 </p>
                 <Link href="/discover" className="block w-full py-5 bg-white/10 hover:bg-white/20 text-white text-center border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Explore Verified</Link>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
