'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashNav from '@/components/DashNav';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Conversation {
  id: string;
  otherUser: { id: string; name: string; photo: string | null; isOnline: boolean; lastActiveText: string; };
  lastMessage: { content: string; isMine: boolean; time: string; } | null;
  unreadCount: number;
}
interface Message { id: string; content: string; senderId: string; createdAt: string; }

function timeLabel(d: string) { return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function dayLabel(d: string) {
  const date = new Date(d), now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const y = new Date(); y.setDate(now.getDate() - 1);
  if (date.toDateString() === y.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

function Avatar({ photo, name, online = false, size = 'md' }: { photo: string | null; name: string; online?: boolean; size?: 'sm'|'md'|'lg'; }) {
  const sz = { sm: 'w-9 h-9', md: 'w-12 h-12', lg: 'w-11 h-11' }[size];
  const dot = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-3 h-3' }[size];
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sz} rounded-xl overflow-hidden bg-rose-50`}>
        {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
          : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-rose-300 text-xl">person</span></div>}
      </div>
      {online && <span className={`absolute -bottom-0.5 -right-0.5 ${dot} bg-emerald-500 rounded-full border-2 border-white`} />}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-rose-50/40 via-white to-white select-none">
      <div className="text-center px-8">
        <div className="text-6xl mb-5">💬</div>
        <h2 className="text-xl font-black text-stone-800 mb-2">Select a conversation</h2>
        <p className="text-stone-400 text-sm max-w-xs leading-relaxed mb-6">Choose a chat on the left to start messaging your matches ❤️</p>
        <Link href="/matches" className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
          <span className="material-symbols-outlined text-sm">handshake</span>View Matches
        </Link>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { data: session } = useSession();
  const uid = session?.user?.id;

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastCountRef = useRef(0);
  const emojiRef = useRef<HTMLDivElement>(null);

  const activeConv = convs.find(c => c.id === activeChatId) || null;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchConvs = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data: Conversation[] = await res.json();
        // Client-side sort by latest too
        setConvs(data);
      }
    } catch (_) {}
    finally { setConvLoading(false); }
  }, []);

  useEffect(() => {
    fetchConvs();
    const iv = setInterval(fetchConvs, 5000);
    return () => clearInterval(iv);
  }, [fetchConvs]);

  // Auto-select from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('openChatId');
    if (stored) { sessionStorage.removeItem('openChatId'); setActiveChatId(stored); setMobileView('chat'); }
  }, []);

  const [msgError, setMsgError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  const fetchMessages = useCallback(async (id: string, silent = false) => {
    if (!silent) { setMsgLoading(true); setMsgError(null); }
    try {
      const res = await fetch(`/api/messages?matchId=${id}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = data.messages || [];
        setMessages(msgs);
        setMsgError(null);
        retryCountRef.current = 0;
        if (msgs.length !== lastCountRef.current) {
          lastCountRef.current = msgs.length;
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: silent ? 'smooth' : 'auto' }), 60);
        }
      } else if (res.status === 403) {
        setMsgError("Match access required to view these messages.");
      } else {
        throw new Error("Failed to load");
      }
    } catch (err) {
      console.error("Message Fetch Error:", err);
      if (!silent) setMsgError("Network error. Retrying...");
      // Auto-retry once if it fails
      if (retryCountRef.current < 2) {
        retryCountRef.current++;
        setTimeout(() => fetchMessages(id, silent), 2000);
      }
    } finally {
      if (!silent) setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeChatId) { setMessages([]); lastCountRef.current = 0; return; }
    fetchMessages(activeChatId);
    // Mark as read
    fetch('/api/messages/read', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: activeChatId }) }).catch(() => {});
    const iv = setInterval(() => fetchMessages(activeChatId, true), 3000);
    return () => clearInterval(iv);
  }, [activeChatId, fetchMessages]);

  // Scroll on first load
  useEffect(() => {
    if (!msgLoading && messages.length > 0) setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'auto' }), 50);
  }, [msgLoading]);

  const selectChat = (id: string) => {
    if (id === activeChatId) return;
    setActiveChatId(id);
    setMessages([]);
    lastCountRef.current = 0;
    setMobileView('chat');
    setMenuOpen(false);
    // Reset unread locally
    setConvs(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending || !activeChatId) return;
    setShowEmoji(false);

    const tempId = `opt-${Date.now()}`;
    const tempMsg: Message = { id: tempId, content: text, senderId: uid || '', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setOptimistic(prev => new Set([...prev, tempId]));
    setInput('');
    setSending(true);

    // Update conv list immediately
    setConvs(prev => {
      const updated = prev.map(c => c.id === activeChatId ? {
        ...c,
        lastMessage: { content: text, isMine: true, time: 'Just now' },
        unreadCount: 0
      } : c);
      return [updated.find(c => c.id === activeChatId)!, ...updated.filter(c => c.id !== activeChatId)];
    });

    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: activeChatId, content: text }),
      });
      if (res.ok) {
        await fetchMessages(activeChatId, true);
        fetchConvs();
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    } catch (_) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
      setOptimistic(prev => { const s = new Set(prev); s.delete(tempId); return s; });
      inputRef.current?.focus();
    }
  };

  // Group messages by day
  const byDay: Record<string, Message[]> = {};
  messages.forEach(m => {
    const d = new Date(m.createdAt).toDateString();
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(m);
  });

  const filtered = convs.filter(c => c.otherUser.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  const totalUnread = convs.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-[#f8f4f4] flex flex-col">
      <DashNav />
      <div className="flex-1 flex max-w-7xl mx-auto w-full md:px-4 md:py-4 md:pb-6 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex flex-1 w-full md:rounded-[2rem] overflow-hidden border border-stone-200/50 shadow-2xl shadow-stone-300/20 bg-white">

          {/* ── LEFT: Chat List ── */}
          <aside className={`flex flex-col bg-white border-r border-stone-100 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] flex-shrink-0`}>
            <div className="px-4 pt-4 pb-3 border-b border-stone-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-lg font-black text-stone-900">Messages</h1>
                  {totalUnread > 0 && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{totalUnread} unread</p>}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-stone-300 uppercase tracking-widest">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />Live
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[17px] text-stone-300">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-8 pr-3 py-2 bg-stone-50 rounded-xl text-sm border border-transparent focus:border-rose-100 focus:bg-white transition-all outline-none placeholder:text-stone-300" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {convLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2"><div className="h-3 bg-stone-100 rounded w-2/3" /><div className="h-2 bg-stone-50 rounded w-4/5" /></div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  {search ? <><span className="material-symbols-outlined text-4xl text-stone-200 mb-2">search_off</span><p className="text-stone-400 text-sm">No results</p></>
                    : <><div className="text-4xl mb-3">💬</div><p className="text-stone-500 text-sm font-bold mb-1">No conversations yet</p><p className="text-stone-300 text-xs mb-4">Match with someone to chat</p><Link href="/matches" className="px-5 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">View Matches</Link></>}
                </div>
              ) : (
                filtered.map(conv => {
                  const active = conv.id === activeChatId;
                  return (
                    <button key={conv.id} onClick={() => selectChat(conv.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all text-left border-r-2 group ${active ? 'bg-rose-50 border-rose-500' : 'hover:bg-stone-50 border-transparent'}`}>
                      <Avatar photo={conv.otherUser.photo} name={conv.otherUser.name} online={conv.otherUser.isOnline} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-black truncate ${active ? 'text-rose-700' : 'text-stone-800'}`}>{conv.otherUser.name}</p>
                          <span className="text-[9px] text-stone-300 flex-shrink-0 ml-1">{conv.lastMessage?.time || ''}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-stone-700 font-semibold' : 'text-stone-400'}`}>
                            {conv.lastMessage ? `${conv.lastMessage.isMine ? 'You: ' : ''}${conv.lastMessage.content}` : <span className="italic text-stone-300">No messages yet</span>}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="flex-shrink-0 min-w-[18px] h-[18px] bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1">
                              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.otherUser.isOnline
                          ? <p className="text-[9px] text-emerald-500 font-bold mt-0.5">● Online</p>
                          : <p className="text-[9px] text-stone-300 mt-0.5">{conv.otherUser.lastActiveText}</p>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── RIGHT: Chat Window ── */}
          <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
            {!activeChatId || !activeConv ? <Placeholder /> : (
              <>
                {/* Header */}
                <div className="px-4 py-3 bg-white border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button className="md:hidden w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" onClick={() => setMobileView('list')}>
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <Link href={`/profile/${activeConv.otherUser.id}`} className="flex items-center gap-3 group">
                      <Avatar photo={activeConv.otherUser.photo} name={activeConv.otherUser.name} online={activeConv.otherUser.isOnline} size="lg" />
                      <div>
                        <h2 className="text-sm font-black text-stone-900 flex items-center gap-1">
                          {activeConv.otherUser.name}
                          <span className="material-symbols-outlined text-rose-500 text-sm fill-1">verified</span>
                        </h2>
                        <p className="text-[10px] mt-0.5 font-bold">
                          {activeConv.otherUser.isOnline
                            ? <span className="text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Online</span>
                            : <span className="text-stone-400">{activeConv.otherUser.lastActiveText}</span>}
                        </p>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 relative">
                    <Link href={`/profile/${activeConv.otherUser.id}`} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all" title="View Profile">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </Link>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(o => !o)} className="w-9 h-9 flex items-center justify-center text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 top-10 bg-white border border-stone-100 rounded-2xl shadow-xl py-1 z-50 w-44">
                          <Link href={`/profile/${activeConv.otherUser.id}`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-all" onClick={() => setMenuOpen(false)}>
                            <span className="material-symbols-outlined text-[18px]">person</span>View Profile
                          </Link>
                          <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-stone-400 hover:bg-stone-50 transition-all">
                            <span className="material-symbols-outlined text-[18px]">block</span>Block User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#fdfafa]/80" style={{ scrollbarWidth: 'thin' }}>
                  {msgLoading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                      <div className="w-8 h-8 border-[3px] border-rose-100 border-t-rose-500 rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Whispering to server...</p>
                    </div>
                  ) : msgError ? (
                    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                      <div className="w-16 h-16 bg-rose-50 text-rose-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">error_outline</span>
                      </div>
                      <h3 className="text-sm font-black text-stone-900 mb-1">Unable to load messages</h3>
                      <p className="text-[11px] text-stone-400 max-w-[200px] leading-relaxed mb-6">{msgError}</p>
                      <button onClick={() => fetchMessages(activeChatId as string)} className="px-6 py-2 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all">
                        Retry Fetch
                      </button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="text-5xl mb-4">👋</div>
                      <h3 className="text-base font-black text-stone-800 mb-1">Say hello!</h3>
                      <p className="text-stone-400 text-sm max-w-xs leading-relaxed">You matched! Break the ice with a warm greeting and start your story ❤️</p>
                      <button onClick={() => { setInput('Hello! 👋'); inputRef.current?.focus(); }}
                        className="mt-5 px-5 py-2 bg-rose-50 text-rose-600 rounded-full text-sm font-bold hover:bg-rose-100 transition-all border border-rose-100">
                        Say &quot;Hello! 👋&quot;
                      </button>
                    </div>
                  ) : (
                    Object.entries(byDay).map(([day, dayMsgs]) => (
                      <div key={day}>
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-stone-100/80 text-stone-400 rounded-full text-[9px] font-black uppercase tracking-widest">{dayLabel(dayMsgs[0].createdAt)}</span>
                        </div>
                        <div className="space-y-1.5">
                          {dayMsgs.map((msg, idx) => {
                            const mine = msg.senderId === uid;
                            const isOpt = optimistic.has(msg.id);
                            const grouped = idx > 0 && dayMsgs[idx-1].senderId === msg.senderId;
                            return (
                              <div key={msg.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'mt-3'} animate-in fade-in duration-200`}>
                                {!mine && (
                                  <div className={`w-7 h-7 rounded-xl overflow-hidden flex-shrink-0 ${grouped ? 'opacity-0' : ''}`}>
                                    {activeConv.otherUser.photo
                                      ? <img src={activeConv.otherUser.photo} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = '/default-avatar.png'; }} />
                                      : <div className="w-full h-full bg-rose-100 flex items-center justify-center"><span className="material-symbols-outlined text-xs text-rose-300">person</span></div>}
                                  </div>
                                )}
                                <div className="max-w-[68%]">
                                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${mine
                                    ? `bg-rose-600 text-white shadow-sm shadow-rose-200/50 ${grouped ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-br-sm'}`
                                    : `bg-white text-stone-800 border border-stone-100 shadow-sm ${grouped ? 'rounded-2xl rounded-bl-md' : 'rounded-2xl rounded-bl-sm'}`
                                  } ${isOpt ? 'opacity-60' : ''} transition-opacity`}>
                                    {msg.content}
                                  </div>
                                  <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 ${mine ? 'justify-end text-stone-400' : 'text-stone-300'}`}>
                                    {timeLabel(msg.createdAt)}
                                    {mine && (isOpt
                                      ? <span className="material-symbols-outlined text-[10px] text-stone-300">schedule</span>
                                      : <span className="material-symbols-outlined text-[10px] text-rose-400">done_all</span>)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 bg-white border-t border-stone-50 flex-shrink-0 relative">
                  {/* Emoji picker */}
                  {showEmoji && (
                    <div ref={emojiRef} className="absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={e => { setInput(prev => prev + e.emoji); inputRef.current?.focus(); }}
                        height={380}
                        width={320}
                        searchDisabled={false}
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button type="button" onClick={() => setShowEmoji(o => !o)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all flex-shrink-0 ${showEmoji ? 'bg-amber-100 text-amber-600' : 'text-stone-300 hover:text-amber-500 hover:bg-amber-50'}`}>
                      <span className="material-symbols-outlined text-[22px]">mood</span>
                    </button>
                    <input ref={inputRef} type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      disabled={sending}
                      placeholder="Type a heartwarming message..."
                      className="flex-1 bg-stone-50 border border-stone-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-100 focus:bg-white focus:border-rose-200 transition-all outline-none placeholder:text-stone-300 disabled:opacity-60"
                      autoComplete="off"
                    />
                    <button type="submit" disabled={!input.trim() || sending}
                      className="w-11 h-11 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-200 hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0">
                      {sending
                        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <span className="material-symbols-outlined text-[20px]">send</span>}
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
