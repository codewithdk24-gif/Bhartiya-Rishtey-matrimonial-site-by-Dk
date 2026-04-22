'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';
import { useModals } from '@/context/ModalContext';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { openUpgradeModal } = useModals();
  
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'accepted'>('incoming');
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const stats = { interests: 12, views: 48, matches: 3 };
  const suggestions = [
    { id: '1', name: 'Ananya S.', age: 26, location: 'Mumbai', profession: 'Interior Designer', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
    { id: '2', name: 'Rohan K.', age: 29, location: 'Pune', profession: 'Software Engineer', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  ];
  const activities = [
    { id: '1', text: 'Someone from New Delhi viewed your profile', time: '2h ago' },
    { id: '2', text: 'New match suggestion based on your career preference', time: '5h ago' },
  ];

  const fetchDashboardData = async () => {
    try {
      const profileRes = await fetch('/api/user/me');
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const fetchInterests = async () => {
    setLoading(true);
    try {
      let type = 'received';
      let statusParam = 'PENDING';
      
      if (activeTab === 'sent') {
        type = 'sent';
        statusParam = 'PENDING';
      } else if (activeTab === 'accepted') {
        type = 'received'; 
        statusParam = 'ACCEPTED';
      }

      const res = await fetch(`/api/interests?type=${type}&status=${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setInterests(data);
      }
    } catch (err) {
      console.error("Interests fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [activeTab]);

  const handleInterestResponse = async (interestId: string, action: 'ACCEPT' | 'REJECT') => {
    setProcessingId(interestId);
    try {
      const res = await fetch('/api/interest/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, action }),
      });
      
      if (res.ok) {
        setInterests(prev => prev.filter(i => i.id !== interestId));
      }
    } catch (err) {
      console.error("Interest response error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const userImage = profile?.profilePhoto || profile?.image || session?.user?.image;
  const rawName = profile?.fullName || profile?.name || session?.user?.name || 'User';
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const userProfession = profile?.profession;
  const userLocation = profile?.location || 'India';
  const identityLine = userProfession ? `${userProfession} • ${userLocation}` : `Based in ${userLocation}`;

  return (
    <div className="min-h-screen bg-[#fdf8f8] selection:bg-rose-100 transition-all duration-500">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        
        {/* REFINED GREETING SECTION */}
        <section className="mb-10 bg-white border border-rose-50 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left flex-col md:flex-row w-full md:w-auto">
            {/* Identity Badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] border-2 border-white shadow-xl overflow-hidden bg-rose-50 flex items-center justify-center ring-2 ring-rose-100/50">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-rose-400">{userName[0]}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full flex items-center justify-center shadow-sm">
                 <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-stone-900 leading-tight mb-1">
                Hello, {userName.split(' ')[0]} 👋
              </h1>
              <p className="text-sm font-medium text-stone-500">{identityLine}</p>
              <p className="text-[11px] text-rose-500 mt-2 font-bold uppercase tracking-[0.2em] opacity-80 flex items-center justify-center md:justify-start gap-1.5">
                <span className="material-symbols-outlined text-xs">favorite</span>
                Let’s find your perfect match
              </p>
            </div>
          </div>

          <Link href="/profile" className="px-10 py-3.5 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 hover:-translate-y-0.5 transition-all">
            Edit Profile
          </Link>
        </section>

        {/* STATS GRID */}
        <section className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: 'New Interests', value: stats.interests, icon: 'favorite', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Profile Views', value: stats.views, icon: 'visibility', color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Today Matches', value: stats.matches, icon: 'celebration', color: 'text-stone-500', bg: 'bg-stone-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-stone-50 p-5 rounded-[1.5rem] flex items-center gap-5 shadow-sm hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-black text-stone-900 leading-none">{stat.value}</p>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* RECOMMENDATIONS */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                   <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                   Recommended for You
                </h3>
                <Link href="/matches/suggested" className="flex items-center gap-2 group">
                  <span className="text-[10px] font-black text-stone-400 group-hover:text-rose-600 transition-colors uppercase tracking-widest">See All</span>
                  <div className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">25+</div>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {suggestions.map((s) => (
                  <div key={s.id} className="bg-white rounded-[2.5rem] p-6 border border-rose-50 shadow-sm hover:shadow-xl hover:shadow-rose-100/10 transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-30" />
                    <div className="flex items-center gap-6 mb-8 relative z-10">
                      <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shadow-lg bg-stone-50 shrink-0 group-hover:scale-105 transition-transform duration-500">
                        <img src={s.photo} alt={s.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-xl font-bold text-stone-900 truncate">{s.name}, {s.age}</h4>
                        <p className="text-sm text-stone-500 truncate">{s.profession}</p>
                        <p className="text-[10px] font-black text-rose-400 mt-1 uppercase tracking-widest truncate">{s.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <Link href={`/profile/${s.id}`} className="flex-1 py-3.5 bg-stone-50 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all">Profile</Link>
                      <button className="flex-[1.5] py-3.5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md shadow-rose-100">Send Interest</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TABBED INTERACTION */}
            <section>
              <div className="bg-white p-2 rounded-full border border-stone-100 shadow-sm mb-10 flex gap-1">
                {[
                  { id: 'incoming', label: 'Interests', icon: 'favorite' },
                  { id: 'sent', label: 'Sent', icon: 'send' },
                  { id: 'accepted', label: 'Matches', icon: 'handshake' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' 
                        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="min-h-[300px]">
                {loading ? (
                  <div className="bg-white/40 h-40 rounded-[2rem] animate-pulse" />
                ) : interests.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 rounded-[3rem] border-2 border-dashed border-rose-50">
                    <span className="material-symbols-outlined text-4xl text-rose-200 mb-4">favorite_border</span>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No recent updates</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {interests.map((item) => (
                      <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-stone-50 shadow-sm flex items-center gap-5 hover:shadow-lg transition-all group">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-stone-50 shadow-inner group-hover:scale-105 transition-transform">
                          <img src={item.otherUser.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.otherUser.id}`} alt={item.otherUser.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 truncate">
                          <h4 className="text-sm font-bold text-stone-900 truncate">{item.otherUser.name}</h4>
                          <p className="text-[10px] text-stone-500 uppercase tracking-widest">{item.otherUser.city || 'India'}</p>
                        </div>
                        <button className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline shrink-0">View Profile</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </div>

          <div className="lg:col-span-4 space-y-10">
            <div className="bg-amber-50/50 border border-amber-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-amber-700 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-xl text-amber-500">auto_awesome</span>
                Pro Tip
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed mb-8 font-medium">
                Profiles with **at least 3 photos** get **40% more visibility** and faster interest responses.
              </p>
              <Link href="/profile" className="block w-full py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-amber-600 transition-all shadow-xl shadow-amber-100">Upload Now</Link>
            </div>

            <div className="bg-white border border-stone-100 p-8 rounded-[3rem] shadow-sm">
              <h3 className="text-[10px] font-black text-stone-900 mb-8 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-1 h-4 bg-rose-400 rounded-full" />
                Live Pulse
              </h3>
              <div className="space-y-8">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-5 items-start group">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                    <div>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium group-hover:text-stone-900 transition-colors">{a.text}</p>
                      <p className="text-[9px] text-stone-300 font-bold uppercase mt-2 tracking-widest">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-lg font-black mb-4 flex items-center gap-3 text-rose-500">
                  <span className="material-symbols-outlined text-2xl">verified</span>
                  Verified
                </h3>
                <p className="text-stone-400 text-xs font-medium leading-relaxed mb-10">
                  Join the elite group of verified members and build instant trust with matches.
                </p>
                <button className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-900/40 hover:bg-rose-500 transition-all">Get Verified</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
