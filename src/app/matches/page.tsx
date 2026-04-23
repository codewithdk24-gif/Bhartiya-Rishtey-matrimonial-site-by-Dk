'use client';

import { useState, useEffect } from 'react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatLocation } from '@/lib/location';
import { getProfileImage } from '@/lib/image';

interface MatchUser {
  id: string;
  name: string;
  age: number | null;
  profile: any;
}

interface MatchItem {
  id: string;
  status: string;
  timestamp: string;
  conversationId: string | null;
  user: MatchUser;
}

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') as 'requests' | 'sent' | 'matched' || 'matched';
  
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'matched'>(defaultTab);
  const [data, setData] = useState<{ requests: MatchItem[], sent: MatchItem[], matched: MatchItem[] }>({
    requests: [],
    sent: [],
    matched: []
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches`);
      const result = await res.json();
      if (res.ok) {
        setData({
          requests: result.received || [],
          sent: result.sent || [],
          matched: result.matched || []
        });
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleRespond = async (interestId: string, action: 'accept' | 'reject') => {
    setProcessingId(interestId);
    try {
      const res = await fetch('/api/interests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, action })
      });
      if (res.ok) {
        fetchMatches();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to respond");
      }
    } catch (err) {
      console.error("Respond Error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const getActiveList = () => {
    if (activeTab === 'requests') return data.requests;
    if (activeTab === 'sent') return data.sent;
    return data.matched;
  };

  const activeList = getActiveList();

  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <DashNav />
      
      <main className="max-w-6xl mx-auto px-4 py-12 pb-32">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">Matches</h1>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Manage your connections and requests</p>
        </header>

        {/* TABS */}
        <div className="flex gap-2 sm:gap-4 mb-12 p-1.5 bg-stone-100 rounded-[2rem] w-fit overflow-x-auto">
          <button 
            onClick={() => { setActiveTab('matched'); router.push('/matches?tab=matched'); }}
            className={`px-6 sm:px-8 py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'matched' ? 'bg-white text-emerald-600 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Matches <span className="ml-2 px-2 py-0.5 bg-stone-100 rounded-full text-stone-500">{data.matched.length}</span>
          </button>
          <button 
            onClick={() => { setActiveTab('requests'); router.push('/matches?tab=requests'); }}
            className={`px-6 sm:px-8 py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'requests' ? 'bg-white text-rose-600 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Requests <span className="ml-2 px-2 py-0.5 bg-stone-100 rounded-full text-stone-500">{data.requests.length}</span>
          </button>
          <button 
            onClick={() => { setActiveTab('sent'); router.push('/matches?tab=sent'); }}
            className={`px-6 sm:px-8 py-3 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sent' ? 'bg-white text-rose-600 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Sent <span className="ml-2 px-2 py-0.5 bg-stone-100 rounded-full text-stone-500">{data.sent.length}</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse border border-white" />
            ))}
          </div>
        ) : activeList.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-16 sm:p-24 text-center border border-dashed border-rose-100">
            <span className={`material-symbols-outlined text-6xl mb-6 block ${activeTab === 'matched' ? 'text-emerald-200' : 'text-rose-200'}`}>
              {activeTab === 'matched' ? 'handshake' : 'favorite_border'}
            </span>
            <h3 className="text-xl font-black text-stone-800 mb-2">No {activeTab} yet</h3>
            <p className="text-stone-400 text-sm mb-8">Start exploring profiles to find your perfect match.</p>
            <Link href="/discover" className="px-10 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 inline-block">Explore Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeList.map((item) => (
              <div key={item.id} className="bg-white rounded-[2.5rem] p-6 border border-white shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                <Link href={`/profile/${item.user.id}`} className="block">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
                      {getProfileImage(item.user.profile) ? (
                        <img src={getProfileImage(item.user.profile)} alt={item.user.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300">
                          <span className="material-symbols-outlined text-3xl">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-stone-900 truncate group-hover:text-rose-600 transition-colors">
                        {item.user.name}
                        {item.status === 'ACCEPTED' && <span className="material-symbols-outlined text-emerald-500 text-sm ml-1 fill-1">verified</span>}
                      </h4>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                        {item.user.age ? `${item.user.age} Yrs • ` : ''}
                        {item.user.profile?.religion || 'Unknown'}
                      </p>
                      <p className="text-[11px] font-bold text-rose-500 mt-1 truncate">{item.user.profile?.profession || 'Professional'}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {formatLocation({ profile: item.user.profile })}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="pt-4 border-t border-stone-50 flex items-center justify-between gap-4">
                  {activeTab === 'requests' && item.status === 'PENDING' ? (
                    <>
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
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                      >
                        {processingId === item.id ? '...' : 'Accept'}
                      </button>
                    </>
                  ) : activeTab === 'matched' || item.status === 'ACCEPTED' ? (
                    <Link 
                      href={`/chat/${item.conversationId}`}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      Start Chat <span className="material-symbols-outlined text-xs">chat</span>
                    </Link>
                  ) : (
                    <div className="w-full flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.status === 'ACCEPTED' ? 'bg-emerald-500' : item.status === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                          <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{item.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
