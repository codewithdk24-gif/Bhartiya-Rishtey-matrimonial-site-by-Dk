'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead?: boolean;
}

interface OtherUser {
  id: string;
  name: string;
  fullName?: string;
  photo?: string;
  photos?: string;
  isOnline?: boolean;
  lastActiveText?: string;
}

function timeLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMsgCountRef = useRef(0);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const resolvePhoto = useCallback((user: OtherUser | null): string => {
    if (!user) return '/default-avatar.png';
    if (user.photo) return user.photo;
    if (user.photos) {
      try {
        const p = typeof user.photos === 'string' ? JSON.parse(user.photos) : user.photos;
        if (Array.isArray(p) && p.length > 0) return p[0];
      } catch (_) {}
    }
    return '/default-avatar.png';
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const msgRes = await fetch(`/api/messages?matchId=${matchId}`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        const newMsgs: Message[] = data.messages || [];
        setMessages(prev => {
          // Remove optimistic messages that are now confirmed
          const confirmedIds = new Set(newMsgs.map((m: Message) => m.id));
          setOptimisticIds(oids => {
            const remaining = new Set([...oids].filter(id => !confirmedIds.has(id)));
            return remaining;
          });
          return newMsgs;
        });
        if (newMsgs.length !== lastMsgCountRef.current) {
          lastMsgCountRef.current = newMsgs.length;
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    } catch (_) {}
  }, [matchId, scrollToBottom]);

  const fetchConvInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${matchId}`);
      if (res.status === 403 || res.status === 404 || res.status === 401) {
        router.replace('/chat');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.otherUser) setOtherUser(data.otherUser);
      }
    } catch (_) {}
  }, [matchId, router]);

  // Initial load
  useEffect(() => {
    if (!matchId) return;
    Promise.all([fetchConvInfo(), fetchMessages()]).finally(() => {
      setLoading(false);
      setTimeout(() => scrollToBottom(false), 100);
    });

    // Polling: messages every 3s, conv info every 10s
    const msgInterval = setInterval(fetchMessages, 3000);
    const convInterval = setInterval(fetchConvInfo, 10000);
    return () => {
      clearInterval(msgInterval);
      clearInterval(convInterval);
    };
  }, [matchId, fetchConvInfo, fetchMessages, scrollToBottom]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || sending) return;

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      content: text,
      senderId: session?.user?.id || '',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setOptimisticIds(prev => new Set([...prev, tempId]));
    setNewMessage('');
    setSending(true);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, content: text }),
      });
      if (!res.ok) {
        // Rollback optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setOptimisticIds(prev => { const s = new Set(prev); s.delete(tempId); return s; });
      } else {
        await fetchMessages();
      }
    } catch (_) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by day
  const messagesByDay: Record<string, Message[]> = {};
  messages.forEach(msg => {
    const day = new Date(msg.createdAt).toDateString();
    if (!messagesByDay[day]) messagesByDay[day] = [];
    messagesByDay[day].push(msg);
  });

  const photo = resolvePhoto(otherUser);
  const displayName = otherUser?.fullName || otherUser?.name || 'Partner';

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50">
        <DashNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-white flex flex-col">
      <DashNav />

      <div className="flex-1 max-w-3xl w-full mx-auto flex flex-col md:my-4 md:mb-8 overflow-hidden md:rounded-[2rem] bg-white border border-stone-100 shadow-2xl shadow-stone-200/40 relative"
           style={{ height: 'calc(100vh - 80px)' }}>

        {/* ── HEADER ── */}
        <div className="px-4 py-3 bg-white border-b border-rose-50 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="w-9 h-9 flex items-center justify-center hover:bg-rose-50 rounded-full transition-all text-stone-400 hover:text-rose-600">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>

            <Link href={`/profile/${otherUser?.id}`} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md ring-1 ring-rose-100">
                  <img src={photo} alt={displayName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
                </div>
                {otherUser?.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h1 className="text-sm font-black text-stone-900 leading-none flex items-center gap-1">
                  {displayName}
                  <span className="material-symbols-outlined text-rose-500 text-sm fill-1">verified</span>
                </h1>
                <p className="text-[10px] font-bold mt-0.5">
                  {otherUser?.isOnline
                    ? <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />Online</span>
                    : <span className="text-stone-400">{otherUser?.lastActiveText || 'Offline'}</span>
                  }
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" title="View Profile">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" title="More options">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
        </div>

        {/* ── MESSAGES AREA ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-[#fdfafa]/50" style={{ scrollbarWidth: 'none' }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mb-5 text-4xl shadow-inner">
                💌
              </div>
              <h2 className="text-lg font-black text-stone-800 mb-2">Say hello!</h2>
              <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
                You matched! Break the ice with a warm hello and start your love story. ❤️
              </p>
            </div>
          ) : (
            <>
              {Object.entries(messagesByDay).map(([day, dayMsgs]) => (
                <div key={day}>
                  {/* Day separator */}
                  <div className="flex justify-center my-4">
                    <span className="px-4 py-1 bg-stone-100 text-stone-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                      {dayLabel(dayMsgs[0].createdAt)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayMsgs.map((msg, idx) => {
                      const isMine = msg.senderId === session?.user?.id;
                      const isOptimistic = optimisticIds.has(msg.id);
                      const prevMsg = dayMsgs[idx - 1];
                      const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);

                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {/* Avatar for receiver */}
                          {!isMine && (
                            <div className={`w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                              <img src={photo} alt={displayName} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
                            </div>
                          )}

                          <div className={`max-w-[72%] group`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed transition-all ${
                              isMine
                                ? 'bg-rose-600 text-white rounded-br-sm shadow-md shadow-rose-200/60'
                                : 'bg-white text-stone-800 rounded-bl-sm border border-stone-100 shadow-sm'
                            } ${isOptimistic ? 'opacity-70' : ''}`}>
                              {msg.content}
                            </div>
                            <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${isMine ? 'justify-end text-stone-400' : 'text-stone-300'}`}>
                              {timeLabel(msg.createdAt)}
                              {isMine && (
                                isOptimistic
                                  ? <span className="material-symbols-outlined text-[10px] text-stone-300">schedule</span>
                                  : <span className="material-symbols-outlined text-[10px] text-rose-400">done_all</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={photo} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                  <div className="bg-white border border-stone-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT AREA ── */}
        <div className="px-4 py-3 bg-white border-t border-rose-50 flex-shrink-0">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            {/* Emoji placeholder button */}
            <button
              type="button"
              className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all flex-shrink-0"
              onClick={() => {
                // Add a heart emoji as quick shortcut
                setNewMessage(m => m + '❤️');
                inputRef.current?.focus();
              }}
              title="Add emoji"
            >
              <span className="material-symbols-outlined text-[22px]">mood</span>
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
                placeholder="Type a heartwarming message..."
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 focus:bg-white focus:border-rose-200 transition-all outline-none placeholder:text-stone-300 disabled:opacity-60"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="w-11 h-11 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[20px]">send</span>
              }
            </button>
          </form>
          <p className="text-[9px] text-center text-stone-300 font-bold uppercase tracking-[0.15em] mt-2">
            Be respectful &amp; kind in your conversations 💕
          </p>
        </div>
      </div>
    </div>
  );
}
