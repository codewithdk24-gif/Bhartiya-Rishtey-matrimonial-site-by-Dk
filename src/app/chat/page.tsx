'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    photo: string | null;
    isOnline: boolean;
    lastActiveText: string;
  };
  lastMessage: {
    content: string;
    isMine: boolean;
    time: string;
    rawTime: string;
  } | null;
  unreadCount: number;
}

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-white">
      <DashNav />

      <div className="max-w-2xl mx-auto px-4 py-10 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight">Messages</h1>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">
              {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-rose-50 shadow-sm text-[10px] font-black text-stone-400 uppercase tracking-widest">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>

        {/* Conversation list */}
        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/40 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-14 bg-stone-100 rounded-2xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-stone-100 rounded-full w-1/2" />
                    <div className="h-2.5 bg-stone-50 rounded-full w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-4xl mb-5 shadow-inner">
                💬
              </div>
              <h3 className="text-xl font-black text-stone-800 mb-2">No conversations yet</h3>
              <p className="text-stone-400 text-sm max-w-xs mb-7 leading-relaxed">
                Start connecting with your matches! When someone accepts your interest, you can chat here.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">local_fire_department</span>
                Explore Profiles
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {conversations.map(conv => {
                const hasUnread = conv.unreadCount > 0;
                return (
                  <Link
                    key={conv.id}
                    href={`/chat/${conv.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-rose-50/50 transition-all group"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border border-stone-100 shadow-sm group-hover:scale-105 transition-transform">
                        {conv.otherUser.photo ? (
                          <img src={conv.otherUser.photo} alt={conv.otherUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>
                      {conv.otherUser.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className={`text-sm font-black truncate ${hasUnread ? 'text-stone-900' : 'text-stone-700'}`}>
                          {conv.otherUser.name}
                        </p>
                        <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest flex-shrink-0 ml-2">
                          {conv.lastMessage?.time || ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate flex-1 ${hasUnread ? 'text-stone-600 font-semibold' : 'text-stone-400'}`}>
                          {conv.lastMessage
                            ? `${conv.lastMessage.isMine ? 'You: ' : ''}${conv.lastMessage.content}`
                            : <span className="text-stone-300 italic">No messages yet</span>
                          }
                        </p>
                        {hasUnread && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1.5 shadow-sm shadow-rose-200">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      {!conv.otherUser.isOnline && (
                        <p className="text-[9px] text-stone-300 mt-0.5">{conv.otherUser.lastActiveText}</p>
                      )}
                    </div>

                    <span className="material-symbols-outlined text-stone-200 group-hover:text-rose-400 transition-colors text-lg flex-shrink-0">
                      chevron_right
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
