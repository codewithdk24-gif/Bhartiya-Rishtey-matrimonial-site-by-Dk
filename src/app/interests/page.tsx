'use client';

import { useState, useEffect } from 'react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';
import { formatLocation } from '@/lib/location';

interface Interest {
  id: string;
  status: string;
  createdAt: string;
  conversationId?: string;
  otherUser: {
    id: string;
    name: string;
    city: string;
    state: string;
    photo: string | null;
    age: number | null;
    religion: string;
  }
}

export default function InterestsPage() {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interests?type=${activeTab}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setInterests(data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterests();
  }, [activeTab]);

  const handleRespond = async (interestId: string, action: 'accept' | 'reject') => {
    setProcessingId(interestId);
    try {
      const res = await fetch('/api/interests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, action })
      });
      if (res.ok) {
        // Refresh list
        fetchInterests();
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

  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <DashNav />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-stone-900 tracking-tight">Interests</h1>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2">Manage your connections and requests</p>
        </header>

        {/* TABS */}
        <div className="flex gap-4 mb-12 p-1.5 bg-stone-100 rounded-[2rem] w-fit">
          <button 
            onClick={() => setActiveTab('received')}
            className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'received' ? 'bg-white text-rose-600 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Received
          </button>
          <button 
            onClick={() => setActiveTab('sent')}
            className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'sent' ? 'bg-white text-rose-600 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] h-64 animate-pulse border border-white" />
            ))}
          </div>
        ) : interests.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-24 text-center border border-dashed border-rose-100">
            <span className="material-symbols-outlined text-6xl text-rose-200 mb-6 block">favorite_border</span>
            <h3 className="text-xl font-black text-stone-800 mb-2">No {activeTab} interests yet</h3>
            <p className="text-stone-400 text-sm mb-8">Start exploring profiles to find your perfect match.</p>
            <Link href="/discover" className="px-10 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 inline-block">Explore Now</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interests.map((interest) => (
              <div key={interest.id} className="bg-white rounded-[2.5rem] p-6 border border-white shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                <Link href={`/profile/${interest.otherUser.id}`} className="block">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 flex-shrink-0">
                      {interest.otherUser.photo ? (
                        <img src={interest.otherUser.photo} alt={interest.otherUser.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300">
                          <span className="material-symbols-outlined text-3xl">person</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-black text-stone-900 truncate group-hover:text-rose-600 transition-colors">{interest.otherUser.name}</h4>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                        {interest.otherUser.age ? `${interest.otherUser.age} Yrs • ` : ''}
                        {interest.otherUser.religion || 'Unknown'}
                      </p>
                      <p className="text-[11px] font-bold text-rose-500 mt-1 truncate">{interest.otherUser.profession}</p>
                      <p className="text-[10px] text-stone-400 mt-0.5 truncate flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {formatLocation(interest.otherUser)}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="pt-4 border-t border-stone-50 flex items-center justify-between gap-4">
                  {activeTab === 'received' && interest.status === 'PENDING' ? (
                    <>
                      <button 
                        onClick={() => handleRespond(interest.id, 'reject')}
                        disabled={!!processingId}
                        className="flex-1 py-3 bg-stone-50 text-stone-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 hover:text-stone-600 transition-all"
                      >
                        Decline
                      </button>
                      <button 
                        onClick={() => handleRespond(interest.id, 'accept')}
                        disabled={!!processingId}
                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                      >
                        {processingId === interest.id ? '...' : 'Accept'}
                      </button>
                    </>
                  ) : (
                    interest.status === 'ACCEPTED' ? (
                      <button 
                        onClick={async () => {
                          if (interest.conversationId) {
                            window.location.href = `/chat/${interest.conversationId}`;
                          } else {
                            const res = await fetch('/api/chat/init', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ targetUserId: interest.otherUser.id })
                            });
                            const data = await res.json();
                            if (data.conversationId) window.location.href = `/chat/${data.conversationId}`;
                          }
                        }}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                      >
                        Start Chat <span className="material-symbols-outlined text-xs">chat</span>
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${interest.status === 'ACCEPTED' ? 'bg-emerald-500' : interest.status === 'REJECTED' ? 'bg-rose-400' : 'bg-amber-400'}`} />
                           <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{interest.status}</span>
                        </div>
                      </div>
                    )
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
