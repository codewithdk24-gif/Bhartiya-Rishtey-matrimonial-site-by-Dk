'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';

export default function ChatListPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => {
        setConversations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-black text-stone-900">Your Conversations</h1>
          <p className="text-sm text-stone-500 mt-1">Connect and chat with your accepted interests.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="shimmer h-20 rounded-2xl" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 px-6">
              <span className="material-symbols-outlined text-6xl text-stone-200 mb-4 block">forum</span>
              <h3 className="text-lg font-bold text-stone-700">No messages yet</h3>
              <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
                Accept interests or send your own to start a conversation.
              </p>
              <Link href="/dashboard" className="mt-6 inline-block bg-primary text-white px-8 py-3 rounded-2xl text-sm font-bold">
                Check Interests
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {conversations.map((conv) => (
                <Link 
                  key={conv.id} 
                  href={`/chat/${conv.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-stone-50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 shadow-sm group-hover:scale-105 transition-transform">
                    <img 
                      src={conv.otherUser.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.id}`} 
                      alt={conv.otherUser.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate pr-10 ${conv.unreadCount > 0 ? 'text-stone-900 font-bold' : 'text-stone-500'}`}>
                      {conv.lastMessage}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{timeAgo(conv.lastMessageTime)}</span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-full min-w-[20px] text-center shadow-sm shadow-primary/20">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="material-symbols-outlined text-stone-200 group-hover:text-primary transition-colors">
                    chevron_right
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
