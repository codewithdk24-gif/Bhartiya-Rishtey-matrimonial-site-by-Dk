'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatLocation } from '@/lib/location';
import { getProfileImage } from '@/lib/image';

interface MatchUser {
  id: string;
  name: string;
  age: number | null;
  isOnline: boolean;
  lastActiveText: string;
  profile: any;
}

interface MatchItem {
  id: string;
  status: string;
  timestamp: string;
  conversationId: string | null;
  compatibilityScore: number;
  unreadCount?: number;
  isNewMatch?: boolean;
  lastMessage: {
    content: string;
    isMine: boolean;
    createdAt: string;
  } | null;
  user: MatchUser;
}

function EmptyState({ tab }: { tab: 'requests' | 'sent' | 'matched' }) {
  const configs = {
    requests: {
      emoji: '💌',
      heading: 'No Requests Yet',
      desc: "You haven't received any interest requests yet. Make your profile shine!",
      cta: 'Complete Profile',
      href: '/profile/edit',
      icon: 'person'
    },
    sent: {
      emoji: '🚀',
      heading: 'No Sent Interests Yet',
      desc: "Start exploring profiles and send your first interest. Someone special is waiting!",
      cta: 'Explore Now',
      href: '/discover',
      icon: 'local_fire_department'
    },
    matched: {
      emoji: '😔',
      heading: 'No Matches Yet',
      desc: "No confirmed matches yet. Send interests and wait for someone to accept — your story begins here!",
      cta: 'Start Exploring',
      href: '/discover',
      icon: 'local_fire_department'
    }
  };
  const cfg = configs[tab];
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner">
        {cfg.emoji}
      </div>
      <h3 className="text-2xl font-black text-stone-800 mb-3">{cfg.heading}</h3>
      <p className="text-stone-400 text-sm max-w-xs mb-8 leading-relaxed">{cfg.desc}</p>
      <Link
        href={cfg.href}
        className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all hover:scale-105"
      >
        <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
        {cfg.cta}
      </Link>
    </div>
  );
}

function OnlineDot({ isOnline }: { isOnline: boolean }) {
  if (isOnline) {
    return (
      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
        Online
      </span>
    );
  }
  return null;
}

function CompatibilityBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Match Score</span>
        <span className={`text-[10px] font-black ${score >= 90 ? 'text-emerald-600' : score >= 80 ? 'text-amber-500' : 'text-rose-500'}`}>{score}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('tab') as 'requests' | 'sent' | 'matched') || 'matched';

  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'matched'>(defaultTab);
  const [data, setData] = useState<{ requests: MatchItem[]; sent: MatchItem[]; matched: MatchItem[] }>({
    requests: [],
    sent: [],
    matched: []
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches`);
      if (res.ok) {
        const result = await res.json();
        setData({
          requests: result.received || [],
          sent: result.sent || [],
          matched: result.matched || []
        });
      }
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    // Live polling every 10 seconds
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const handleRespond = async (interestId: string, action: 'accept' | 'reject') => {
    setProcessingId(interestId);
    try {
      const res = await fetch('/api/interests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, action })
      });
      if (res.ok) {
        await fetchMatches();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to respond');
      }
    } catch (err) {
      console.error('Respond Error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const setTab = (tab: 'requests' | 'sent' | 'matched') => {
    setActiveTab(tab);
    router.replace(`/matches?tab=${tab}`, { scroll: false });
  };

  const activeList = activeTab === 'requests' ? data.requests : activeTab === 'sent' ? data.sent : data.matched;

  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <DashNav />

      <main className="max-w-6xl mx-auto px-4 py-12 pb-32">
        {/* Header */}
        <header className="mb-6 md:mb-10 flex items-center justify-between flex-wrap gap-4 sticky top-16 md:top-20 z-40 bg-[#fdf8f8]/80 backdrop-blur-md py-2 -mx-4 px-4 border-b border-rose-100/50 md:border-none md:relative md:top-0 md:bg-transparent">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-stone-900 tracking-tight">Matches</h1>
            <p className="hidden md:block text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">
              Your connections &amp; relationship requests
            </p>
          </div>
          {/* Live Pulse - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-rose-50 shadow-sm text-[10px] font-black text-stone-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live Updates
          </div>
        </header>

        {/* MOMENTUM STRIP - MOBILE ONLY */}
        {activeTab === 'matched' && data.matched.filter(m => (m.unreadCount || 0) > 0).length > 0 && (
          <div className="md:hidden mb-6 animate-in slide-in-from-top duration-500">
            <div className="bg-[#111827] text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500 fill-1 text-xl animate-pulse">chat_bubble</span>
                <p className="text-[11px] font-black uppercase tracking-widest">
                  You have <span className="text-rose-400">{data.matched.filter(m => (m.unreadCount || 0) > 0).length} chats</span> waiting
                </p>
              </div>
              <span className="material-symbols-outlined text-sm text-stone-500">east</span>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-2 mb-8 md:mb-10 p-1.5 bg-stone-100 rounded-[2rem] w-full md:w-fit overflow-x-auto no-scrollbar">
          {[
            { key: 'matched' as const, label: 'Matches', count: data.matched.length, activeColor: 'text-emerald-600' },
            { key: 'requests' as const, label: 'Requests', count: data.requests.length, activeColor: 'text-rose-600' },
            { key: 'sent' as const, label: 'Sent', count: data.sent.length, activeColor: 'text-blue-600' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex-1 md:flex-none relative px-4 sm:px-7 py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                activeTab === tab.key ? `bg-white ${tab.activeColor} shadow-md` : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black ${
                  activeTab === tab.key ? 'bg-current text-white' : 'bg-stone-200 text-stone-500'
                }`} style={activeTab === tab.key ? { color: 'white', background: 'currentColor' } : {}}>
                  <span style={activeTab === tab.key ? { filter: 'invert(1)' } : {}}>{tab.count}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] h-72 animate-pulse border border-stone-50 shadow-sm" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-dashed border-rose-100 shadow-sm">
            <EmptyState tab={activeTab} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(() => {
              const sortedList = [...activeList].sort((a, b) => {
                if ((b.unreadCount || 0) !== (a.unreadCount || 0)) return (b.unreadCount || 0) - (a.unreadCount || 0);
                if (b.user.isOnline !== a.user.isOnline) return b.user.isOnline ? 1 : -1;
                if (b.isNewMatch !== a.isNewMatch) return b.isNewMatch ? 1 : -1;
                return b.compatibilityScore - a.compatibilityScore;
              });

              return sortedList.map(item => {
                const photo = getProfileImage(item.user.profile);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col relative"
                  >
                    {/* URGENCY BADGE - MOBILE ONLY */}
                    <div className="md:hidden absolute top-4 right-4 z-10">
                      {item.unreadCount && item.unreadCount > 0 ? (
                        <span className="px-2 py-1 bg-rose-600 text-white rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-lg">
                          <span className="material-symbols-outlined text-[8px] fill-1">chat_bubble</span>
                          New Message
                        </span>
                      ) : item.user.isOnline ? (
                        <span className="px-2 py-1 bg-emerald-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                          Online Now
                        </span>
                      ) : item.isNewMatch ? (
                        <span className="px-2 py-1 bg-[#111827] text-white rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                          <span className="material-symbols-outlined text-[8px] text-rose-500 fill-1">favorite</span>
                          New Match
                        </span>
                      ) : null}
                    </div>

                    <Link href={`/profile/${item.user.id}`} className="block">
                      {/* Avatar + Info */}
                      <div className="flex items-center md:items-start gap-4 mb-4">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
                          {photo ? (
                            <img
                              src={photo}
                              alt={item.user.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300">
                              <span className="material-symbols-outlined text-3xl">person</span>
                            </div>
                          )}
                          {/* Online dot overlay */}
                          {item.user.isOnline && (
                            <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-12 md:pr-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-black text-stone-900 truncate group-hover:text-rose-600 transition-colors">
                              {item.user.name}, {item.user.age}
                            </h4>
                          </div>
                          
                          <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">location_on</span>
                            {formatLocation({ profile: item.user.profile })}
                          </p>
                          
                          <div className="hidden md:block mt-1">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                               {item.user.profile?.religion ? `${item.user.profile.religion} • ` : ''}
                               {item.user.profile?.profession || 'Professional'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Online status + last active - Hidden on mobile if badge shown */}
                      <div className="hidden md:flex items-center gap-3 mb-3">
                        {item.user.isOnline ? (
                          <OnlineDot isOnline={true} />
                        ) : (
                          <span className="text-[9px] text-stone-400 font-semibold">{item.user.lastActiveText}</span>
                        )}
                      </div>

                      {/* Last message preview (VERY IMPORTANT FOR CONVERSATION FEED) */}
                      {activeTab === 'matched' && (
                        <div className={`rounded-xl px-3 py-2 mb-3 border ${item.unreadCount ? 'bg-rose-50 border-rose-100' : 'bg-stone-50 border-stone-100'}`}>
                          <p className={`text-[10px] truncate ${item.unreadCount ? 'text-rose-600 font-bold' : 'text-stone-500'}`}>
                            {item.lastMessage ? (
                              <>
                                <span className="font-black">{item.lastMessage.isMine ? 'You: ' : ''}</span>
                                {item.lastMessage.content}
                              </>
                            ) : (
                              <span className="italic">Say hello 👋 and start your story</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Humanized Last Active - Mobile Only */}
                      <div className="md:hidden mb-3">
                         <span className="text-[9px] text-stone-300 font-black uppercase tracking-widest">{item.user.lastActiveText}</span>
                      </div>

                      {/* Compatibility score bar - Hidden on mobile matched to reduce noise */}
                      <div className="hidden md:block">
                        <CompatibilityBar score={item.compatibilityScore} />
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="pt-3 md:pt-4 mt-auto border-t border-stone-50">
                      {activeTab === 'requests' && item.status === 'PENDING' ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleRespond(item.id, 'reject')}
                            disabled={!!processingId}
                            className="flex-1 py-3 bg-stone-50 text-stone-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 hover:text-stone-600 transition-all"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleRespond(item.id, 'accept')}
                            disabled={!!processingId}
                            className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-1.5"
                          >
                            {processingId === item.id ? (
                              <span className="animate-spin material-symbols-outlined text-xs">progress_activity</span>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-xs">favorite</span>
                                Accept
                              </>
                            )}
                          </button>
                        </div>
                      ) : activeTab === 'matched' ? (
                        <div className="flex flex-col gap-2">
                           <button
                             onClick={async () => {
                               if (item.conversationId) {
                                 router.push(`/chat/${item.conversationId}`);
                               } else {
                                 const res = await fetch('/api/chat/init', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ targetUserId: item.user.id })
                                 });
                                 const d = await res.json();
                                 if (d.conversationId) router.push(`/chat/${d.conversationId}`);
                               }
                             }}
                             className="w-full py-4 md:py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-2 active:scale-95"
                           >
                             <span className="material-symbols-outlined text-sm">chat_bubble</span>
                             {item.lastMessage ? 'Continue Chat' : 'Start Conversation'}
                           </button>
                           
                           {!item.lastMessage && (
                             <div className="flex gap-2 mt-1">
                                <button className="flex-1 py-2 bg-stone-50 text-stone-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-stone-100 hover:bg-rose-50 hover:text-rose-500 transition-all">Say Hi 👋</button>
                                <button className="flex-1 py-2 bg-stone-50 text-stone-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-stone-100 hover:bg-rose-50 hover:text-rose-500 transition-all">Ask Interests 🎭</button>
                             </div>
                           )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full px-2 py-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              item.status === 'ACCEPTED' ? 'bg-emerald-500' : item.status === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'
                            }`} />
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                              {item.status === 'PENDING' ? 'Awaiting Response' : item.status}
                            </span>
                          </div>
                          {item.status === 'PENDING' && (
                            <span className="text-[8px] font-bold text-stone-300 italic">Wait for acceptance</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
