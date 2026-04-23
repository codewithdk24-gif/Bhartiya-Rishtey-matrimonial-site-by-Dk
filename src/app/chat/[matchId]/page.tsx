'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';

export default function ChatPage() {
  const { matchId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatData = async () => {
    try {
      // 1. Fetch Conversation Info first to check access
      const userRes = await fetch(`/api/conversations/${matchId}`);
      if (userRes.status === 403 || userRes.status === 404 || userRes.status === 401) {
        window.location.href = '/chat';
        return;
      }
      
      const userData = await userRes.json();
      if (userData.otherUser) {
        setOtherUser(userData.otherUser);
      }

      // 2. Fetch Messages
      const msgRes = await fetch(`/api/messages?matchId=${matchId}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
      }

    } catch (err) {
      console.error('Fetch chat data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchId) {
      fetchChatData();
      const interval = setInterval(fetchChatData, 4000); 
      return () => clearInterval(interval);
    }
  }, [matchId]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const text = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: text }),
      });

      if (res.ok) {
        fetchChatData();
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdf8f8]">
        <DashNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
           <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const otherName = otherUser?.fullName || otherUser?.name || 'Partner';
  
  let otherPhoto = `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherName}`;
  if (otherUser?.photo) {
    otherPhoto = otherUser.photo;
  } else if (otherUser?.photos) {
    try {
      const parsed = typeof otherUser.photos === 'string' ? JSON.parse(otherUser.photos) : otherUser.photos;
      if (Array.isArray(parsed) && parsed.length > 0) otherPhoto = parsed[0];
    } catch (e) {
      console.error("Photo Parse Error:", e);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 flex flex-col selection:bg-rose-100">
      <DashNav />

      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col md:my-6 md:mb-10 overflow-hidden md:rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white shadow-2xl relative">
        
        {/* PREMIUM CHAT HEADER */}
        <div className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-rose-50 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Link href="/messages" className="w-10 h-10 flex items-center justify-center hover:bg-rose-50 rounded-full transition-all text-stone-400 hover:text-rose-600">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg border-2 border-white ring-2 ring-rose-50">
                  <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              
              <div>
                <h1 className="text-base font-black text-stone-900 leading-none mb-1 flex items-center gap-1.5">
                  {otherName}
                  <span className="material-symbols-outlined text-rose-500 text-lg fill-1">verified</span>
                </h1>
                <div className="flex items-center gap-1.5">
                   <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                <span className="material-symbols-outlined">call</span>
             </button>
             <button className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                <span className="material-symbols-outlined">more_vert</span>
             </button>
          </div>
        </div>

        {/* MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-[#fffafa]/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-6 text-rose-300 animate-pulse">
                <span className="material-symbols-outlined text-5xl">favorite</span>
              </div>
              <h2 className="text-xl font-black text-stone-800 mb-2 tracking-tight">Express your interest!</h2>
              <p className="text-sm text-stone-400 max-w-xs mx-auto leading-relaxed font-medium">
                The best way to start is with a warm &apos;Hello&apos;. Good luck on your journey! ❤️
              </p>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="flex justify-center my-8">
                  <span className="px-4 py-1.5 bg-stone-100 text-stone-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">Today</span>
               </div>
               
               {messages.map((msg) => {
                 const isMine = msg.senderId === session?.user?.id;
                 return (
                   <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                     <div className={`max-w-[75%] group relative`}>
                       <div className={`px-5 py-3.5 rounded-[1.75rem] text-sm leading-relaxed shadow-sm transition-all hover:shadow-md ${isMine
                           ? 'bg-rose-600 text-white rounded-tr-none shadow-rose-200'
                           : 'bg-white text-stone-700 rounded-tl-none border border-rose-50'
                         }`}>
                         {msg.content}
                       </div>
                       <div className={`text-[9px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 ${isMine ? 'justify-end text-rose-300' : 'text-stone-300'}`}>
                         {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         {isMine && <span className="material-symbols-outlined text-[10px] text-rose-400">done_all</span>}
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-6 bg-white/80 backdrop-blur-md border-t border-rose-50 relative z-20">
          <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto">
            <button type="button" className="w-12 h-12 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all">
               <span className="material-symbols-outlined text-2xl">add_circle</span>
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a heartwarming message..."
                className="w-full bg-stone-50/50 border border-stone-100 rounded-[1.5rem] px-6 py-4 text-sm focus:ring-4 focus:ring-rose-500/5 focus:bg-white transition-all outline-none font-medium placeholder:text-stone-300"
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300 hover:text-amber-500 transition-all">
                 <span className="material-symbols-outlined">mood</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-14 h-14 bg-rose-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-rose-200 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shrink-0"
            >
              <span className="material-symbols-outlined text-2xl">send</span>
            </button>
          </form>
          <p className="text-[9px] text-center text-stone-300 font-bold uppercase tracking-[0.2em] mt-4">
             Always be respectful & kind in your conversations.
          </p>
        </div>

      </div>
    </div>
  );
}
