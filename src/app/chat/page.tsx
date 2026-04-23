'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────
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
  } | null;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────
function timeLabel(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

// ─── Avatar ───────────────────────────────────────────────
function Avatar({ photo, name, size = 'md', isOnline = false }: {
  photo: string | null; name: string; size?: 'sm' | 'md' | 'lg'; isOnline?: boolean;
}) {
  const sizes = { sm: 'w-9 h-9 rounded-xl', md: 'w-12 h-12 rounded-xl', lg: 'w-11 h-11 rounded-xl' };
  const dotSizes = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-3 h-3' };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} overflow-hidden bg-rose-50`}>
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
          : <div className="w-full h-full flex items-center justify-center text-rose-300">
              <span className="material-symbols-outlined text-xl">person</span>
            </div>
        }
      </div>
      {isOnline && (
        <span className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} bg-emerald-500 rounded-full border-2 border-white shadow`} />
      )}
    </div>
  );
}

// ─── Empty Placeholder (no chat selected) ─────────────────
function ChatPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50/40 via-white to-rose-50/20 select-none">
      <div className="text-center px-8">
        <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
          💬
        </div>
        <h2 className="text-xl font-black text-stone-800 mb-2">Select a conversation</h2>
        <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
          Click on a chat from the left to start messaging. Your matches are waiting! ❤️
        </p>
        <Link href="/matches" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
          <span className="material-symbols-outlined text-sm">handshake</span>
          View Matches
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function ChatPage() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Layout state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMsgCountRef = useRef(0);

  const activeConv = conversations.find(c => c.id === activeChatId) || null;

  // ── Fetch conversation list ──
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
    finally { setConvLoading(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Auto-select from sessionStorage (redirected from /chat/[id])
  useEffect(() => {
    const stored = sessionStorage.getItem('openChatId');
    if (stored) {
      sessionStorage.removeItem('openChatId');
      setActiveChatId(stored);
      setMobileView('chat');
    }
  }, []);

  // ── Fetch messages for active chat ──
  const fetchMessages = useCallback(async (chatId: string, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const res = await fetch(`/api/messages?matchId=${chatId}`);
      if (res.ok) {
        const data = await res.json();
        const newMsgs: Message[] = data.messages || [];
        setMessages(newMsgs);
        if (newMsgs.length !== lastMsgCountRef.current) {
          lastMsgCountRef.current = newMsgs.length;
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
        }
      }
    } catch (_) {}
    finally { if (!silent) setMsgLoading(false); }
  }, []);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); lastMsgCountRef.current = 0; return; }
    fetchMessages(activeChatId);
    const interval = setInterval(() => fetchMessages(activeChatId, true), 3000);
    return () => clearInterval(interval);
  }, [activeChatId, fetchMessages]);

  // Auto-scroll on first load of messages
  useEffect(() => {
    if (messages.length > 0 && msgLoading === false) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
    }
  }, [msgLoading]);

  // ── Select chat ──
  const selectChat = (id: string) => {
    if (id === activeChatId) return;
    setActiveChatId(id);
    setMessages([]);
    lastMsgCountRef.current = 0;
    setMobileView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Send message ──
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || sending || !activeChatId) return;

    const tempId = `opt-${Date.now()}`;
    const tempMsg: Message = { id: tempId, content: text, senderId: currentUserId || '', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setOptimisticIds(prev => new Set([...prev, tempId]));
    setNewMessage('');
    setSending(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: activeChatId, content: text }),
      });
      if (res.ok) {
        await fetchMessages(activeChatId, true);
        fetchConversations();
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (_) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      setOptimisticIds(prev => { const s = new Set(prev); s.delete(tempId); return s; });
      inputRef.current?.focus();
    }
  };

  // ── Group messages by day ──
  const messagesByDay: Record<string, Message[]> = {};
  messages.forEach(msg => {
    const day = new Date(msg.createdAt).toDateString();
    if (!messagesByDay[day]) messagesByDay[day] = [];
    messagesByDay[day].push(msg);
  });

  // ── Filter conversations by search ──
  const filteredConvs = conversations.filter(c =>
    c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f4f4] flex flex-col">
      <DashNav />

      {/* ── Outer shell ── */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full md:px-4 md:py-4 md:pb-6 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex flex-1 w-full md:rounded-[2rem] overflow-hidden border border-stone-200/60 shadow-2xl shadow-stone-300/30 bg-white">

          {/* ════════════════════════════════════════════════
              LEFT PANEL — Chat List
          ════════════════════════════════════════════════ */}
          <aside className={`
            flex flex-col bg-white border-r border-stone-100
            ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
            w-full md:w-[320px] lg:w-[360px] flex-shrink-0
          `}>
            {/* List Header */}
            <div className="px-5 pt-5 pb-3 border-b border-stone-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-lg font-black text-stone-900">Messages</h1>
                  {totalUnread > 0 && (
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{totalUnread} unread</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-stone-300 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-stone-300">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full pl-9 pr-4 py-2.5 bg-stone-50 rounded-xl text-sm border border-transparent focus:border-rose-100 focus:bg-white transition-all outline-none placeholder:text-stone-300 font-medium"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f1f5f9 transparent' }}>
              {convLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-stone-100 rounded w-2/3" />
                        <div className="h-2.5 bg-stone-50 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {searchQuery
                    ? <><span className="material-symbols-outlined text-4xl text-stone-200 mb-3">search_off</span><p className="text-stone-400 text-sm">No chats found</p></>
                    : <>
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-stone-500 text-sm font-bold mb-1">No conversations yet</p>
                        <p className="text-stone-300 text-xs">Match with someone to start chatting</p>
                        <Link href="/matches" className="mt-5 px-5 py-2.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">
                          View Matches
                        </Link>
                      </>
                  }
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const isActive = conv.id === activeChatId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectChat(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left group relative
                        ${isActive
                          ? 'bg-rose-50 border-r-2 border-rose-600'
                          : 'hover:bg-stone-50 border-r-2 border-transparent'
                        }`}
                    >
                      <Avatar photo={conv.otherUser.photo} name={conv.otherUser.name} size="md" isOnline={conv.otherUser.isOnline} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-black truncate ${isActive ? 'text-rose-700' : 'text-stone-800'}`}>
                            {conv.otherUser.name}
                          </p>
                          <span className="text-[9px] font-bold text-stone-300 flex-shrink-0 ml-2">
                            {conv.lastMessage?.time || ''}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-stone-600 font-semibold' : 'text-stone-400'}`}>
                            {conv.lastMessage
                              ? `${conv.lastMessage.isMine ? 'You: ' : ''}${conv.lastMessage.content}`
                              : <span className="italic text-stone-300">No messages yet</span>
                            }
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ════════════════════════════════════════════════
              RIGHT PANEL — Chat Window
          ════════════════════════════════════════════════ */}
          <main className={`
            flex-1 flex flex-col min-w-0 overflow-hidden
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
          `}>
            {!activeChatId || !activeConv ? (
              <ChatPlaceholder />
            ) : (
              <>
                {/* ── Chat Header ── */}
                <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <button
                      className="md:hidden w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all mr-1"
                      onClick={() => setMobileView('list')}
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <Link href={`/profile/${activeConv.otherUser.id}`} className="flex items-center gap-3 group">
                      <Avatar photo={activeConv.otherUser.photo} name={activeConv.otherUser.name} size="lg" isOnline={activeConv.otherUser.isOnline} />
                      <div>
                        <h2 className="text-sm font-black text-stone-900 leading-none flex items-center gap-1">
                          {activeConv.otherUser.name}
                          <span className="material-symbols-outlined text-rose-500 text-sm fill-1">verified</span>
                        </h2>
                        <p className="text-[10px] mt-0.5 font-bold">
                          {activeConv.otherUser.isOnline
                            ? <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />Online</span>
                            : <span className="text-stone-400">{activeConv.otherUser.lastActiveText}</span>
                          }
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link href={`/profile/${activeConv.otherUser.id}`} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" title="View Profile">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </Link>
                    <button className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" title="More">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </div>

                {/* ── Messages Area ── */}
                <div
                  className="flex-1 overflow-y-auto px-4 py-4 bg-[#fdfafa]/80"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#fce7f3 transparent' }}
                >
                  {msgLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-3 border-rose-100 border-t-rose-500 rounded-full animate-spin border-[3px]" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="text-5xl mb-4">💌</div>
                      <h3 className="text-base font-black text-stone-800 mb-2">Say hello!</h3>
                      <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
                        Break the ice — send your first message and start your story ❤️
                      </p>
                    </div>
                  ) : (
                    Object.entries(messagesByDay).map(([day, dayMsgs]) => (
                      <div key={day}>
                        {/* Day separator */}
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-stone-100/80 text-stone-400 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {dayLabel(dayMsgs[0].createdAt)}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {dayMsgs.map((msg, idx) => {
                            const isMine = msg.senderId === currentUserId;
                            const isOptimistic = optimisticIds.has(msg.id);
                            const prevMsg = dayMsgs[idx - 1];
                            const isGrouped = prevMsg && prevMsg.senderId === msg.senderId;

                            return (
                              <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isGrouped ? '' : 'mt-3'}`}
                              >
                                {/* Receiver avatar */}
                                {!isMine && (
                                  <div className={`w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 ${isGrouped ? 'opacity-0' : 'opacity-100'}`}>
                                    {activeConv.otherUser.photo
                                      ? <img src={activeConv.otherUser.photo} alt={activeConv.otherUser.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
                                      : <div className="w-full h-full bg-rose-100 flex items-center justify-center"><span className="material-symbols-outlined text-xs text-rose-400">person</span></div>
                                    }
                                  </div>
                                )}

                                <div className="max-w-[68%]">
                                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                                    isMine
                                      ? `bg-rose-600 text-white shadow-md shadow-rose-200/60 ${isGrouped ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-br-sm'}`
                                      : `bg-white text-stone-800 border border-stone-100 shadow-sm ${isGrouped ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-bl-sm'}`
                                  } ${isOptimistic ? 'opacity-60' : 'opacity-100'} transition-opacity`}>
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
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ── Input Area ── */}
                <div className="px-4 py-3 bg-white border-t border-stone-50 flex-shrink-0">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setNewMessage(m => m + '❤️'); inputRef.current?.focus(); }}
                      className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all flex-shrink-0"
                      title="Emoji"
                    >
                      <span className="material-symbols-outlined text-[22px]">mood</span>
                    </button>

                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      disabled={sending}
                      placeholder="Type a heartwarming message..."
                      className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-100 focus:bg-white focus:border-rose-200 transition-all outline-none placeholder:text-stone-300 disabled:opacity-60 font-medium"
                      autoComplete="off"
                    />

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="w-11 h-11 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-200 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0"
                    >
                      {sending
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-[20px]">send</span>
                      }
                    </button>
                  </form>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
