'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';
import { useModals } from '@/context/ModalContext';

export default function DashboardPage() {
  const router = useRouter();
  const { openUpgradeModal } = useModals();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'sent' | 'accepted'>('incoming');
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
      let status = 'PENDING';
      
      if (activeTab === 'sent') {
        type = 'sent';
        status = 'PENDING';
      } else if (activeTab === 'accepted') {
        type = 'received'; // Combined for matches in real app, but following prompt
        status = 'ACCEPTED';
      }

      const res = await fetch(`/api/interests?type=${type}&status=${status}`);
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
        // Remove from list or update
        setInterests(prev => prev.filter(i => i.id !== interestId));
        if (action === 'ACCEPT') {
          const data = await res.json();
        }
      }
    } catch (err) {
      console.error("Interest response error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const userPlan = (profile?.plan || 'FREE').toUpperCase();
  const isPremium = userPlan !== 'FREE';

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <DashNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32">
        
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-headline text-3xl font-black text-stone-900 leading-tight">
              Namaste, <span className="text-primary">{profile?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-stone-500 font-medium text-sm mt-1">Welcome back to your matrimonial dashboard.</p>
          </div>
          <div className="hidden sm:block">
            <Link href="/profile" className="flex items-center gap-2 bg-white border border-stone-200 px-4 py-2 rounded-2xl hover:bg-stone-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-stone-400">edit_square</span>
              <span className="text-sm font-bold text-stone-600">Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Interest Hub Section */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-stone-100 bg-stone-50/50">
            {[
              { id: 'incoming', label: 'Incoming', icon: 'inbox_customize' },
              { id: 'sent', label: 'Sent Interests', icon: 'outbox' },
              { id: 'accepted', label: 'Matches', icon: 'handshake' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-5 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-stone-50 rounded-3xl h-48 animate-pulse border border-stone-100" />
                ))}
              </div>
            ) : interests.length === 0 ? (
              <div className="text-center py-20 bg-stone-50/50 rounded-[2rem] border border-dashed border-stone-200">
                <span className="material-symbols-outlined text-6xl text-stone-200 mb-4">
                  {activeTab === 'incoming' ? 'favorite_border' : activeTab === 'sent' ? 'near_me' : 'group'}
                </span>
                <h3 className="text-lg font-bold text-stone-700">No {activeTab} interests yet</h3>
                <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
                  {activeTab === 'incoming' ? "Interests from other members will appear here." : "Start exploring to find someone special!"}
                </p>
                <Link href="/search" className="mt-6 inline-block bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20">
                  Explore Profiles
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interests.map((item) => (
                  <div key={item.id} className="group bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-stone-100">
                          <img 
                            src={item.otherUser.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.otherUser.id}`} 
                            alt={item.otherUser.name}
                            className={`w-full h-full object-cover transition-all ${!isPremium && activeTab === 'incoming' ? 'blur-md grayscale' : ''}`}
                          />
                          {!isPremium && activeTab === 'incoming' && (
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-white text-lg">lock</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-headline text-lg font-bold text-stone-900 ${!isPremium && activeTab === 'incoming' ? 'blur-[3px]' : ''}`}>
                            {item.otherUser.name}{item.otherUser.age && `, ${item.otherUser.age}`}
                          </h4>
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            {item.otherUser.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-stone-300 uppercase block">{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-col gap-3">
                        {activeTab === 'incoming' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleInterestResponse(item.id, 'ACCEPT')}
                              disabled={processingId === item.id}
                              className="flex-1 bg-primary text-white py-2.5 rounded-xl text-[11px] font-bold shadow-md shadow-primary/10 hover:bg-primary-dark transition-all disabled:opacity-50"
                            >
                              Accept Interest
                            </button>
                            <button 
                              onClick={() => handleInterestResponse(item.id, 'REJECT')}
                              disabled={processingId === item.id}
                              className="flex-1 bg-stone-100 text-stone-600 py-2.5 rounded-xl text-[11px] font-bold hover:bg-stone-200 transition-all disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : activeTab === 'sent' ? (
                          <div className="flex items-center justify-between px-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                              item.status === 'ACCEPTED' ? 'text-green-500' : item.status === 'REJECTED' ? 'text-stone-400' : 'text-gold'
                            }`}>
                              Status: {item.status}
                            </span>
                            <Link href={`/profile/${item.otherUser.id}`} className="text-[10px] font-bold text-primary hover:underline">
                              View Profile
                            </Link>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Link 
                              href={`/chat`} 
                              className="flex-1 bg-stone-900 text-white py-2.5 rounded-xl text-[11px] font-bold text-center hover:bg-black transition-all"
                            >
                              Start Messaging
                            </Link>
                            <Link 
                              href={`/profile/${item.otherUser.id}`}
                              className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-[11px] font-bold text-center hover:bg-stone-50 transition-all"
                            >
                              View Profile
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium Upsell for Free Users in Incoming Tab */}
          {!isPremium && activeTab === 'incoming' && interests.length > 0 && (
            <div className="px-8 py-6 bg-primary/5 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">visibility_off</span>
                </div>
                <div>
                  <p className="text-sm text-stone-900 font-black tracking-tight">{interests.length} people are interested in you</p>
                  <p className="text-xs text-stone-500 font-medium">Upgrade to Prime to reveal their profiles and start chatting.</p>
                </div>
              </div>
              <button 
                onClick={() => openUpgradeModal('unlimited_interests', 'PRIME')}
                className="bg-stone-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-stone-900/20 hover:scale-105 transition-all active:scale-95 shrink-0"
              >
                Reveal Who
              </button>
            </div>
          )}
        </div>

        {/* Other Sections (Simplified placeholders for remaining dashboard) */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="glass-card p-8 bg-white/60">
            <h3 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">analytics</span>
              Profile Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-stone-500">Profile Completion</span>
                <span className="font-bold text-stone-900">85%</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%]" />
              </div>
              <p className="text-xs text-stone-400">Complete your bio and add more photos to appear in 5x more searches.</p>
            </div>
          </div>
          
          <div className="glass-card p-8 bg-white/60 relative overflow-hidden group">
            {!isPremium && (
              <div 
                onClick={() => openUpgradeModal('profile_views', 'ROYAL')}
                className="absolute inset-0 bg-stone-50/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center cursor-pointer group-hover:backdrop-blur-[1px] transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-all">
                  <span className="material-symbols-outlined">visibility_off</span>
                </div>
                <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">See Who Viewed You</p>
                <p className="text-[9px] text-stone-500 font-bold mt-1 uppercase tracking-tighter">Available in Royal</p>
              </div>
            )}
            <h3 className="font-headline text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility</span>
              Recent Profile Visitors
            </h3>
            <div className="space-y-4 opacity-40">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-stone-100 rounded w-1/3" />
                    <div className="h-2 bg-stone-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-8 bg-white/60">
            <h3 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              Trust & Safety
            </h3>
            <p className="text-sm text-stone-500 mb-4 font-medium leading-relaxed">Verify your account with a valid ID to get a verified badge and increase trust with other members.</p>
            <button className="text-xs font-black text-primary hover:underline uppercase tracking-[0.2em]">Get Verified Now →</button>
          </div>
        </div>

      </div>
    </div>
  );
}
