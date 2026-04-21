'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'SYSTEM' | 'CONTACT_SHARE';
  createdAt: string;
  isRead: boolean;
}

interface ChatMeta {
  canSendMore: boolean;
  messagesUsed: number;
  messageLimit: number;
}

export default function ChatWindow() {
  const { conversationId } = useParams();
  const router = useRouter();
  const { openUpgradeModal } = useModals();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [chatMeta, setChatMeta] = useState<ChatMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // ─── POLLING LOGIC (Step 3 & 4) ───────────────────────────────────

  const fetchMessages = useCallback(async (isInitial = false) => {
    if (document.visibilityState !== 'visible' && !isInitial) return;

    try {
      const url = `/api/messages?conversationId=${conversationId}`;
      const res = await fetch(url);
      
      if (res.status === 401) return router.push('/login');
      if (res.status === 403) {
        setError('This conversation is unavailable');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOtherUser(data.otherUser);
      setChatMeta(data.chatMeta);

      // Smart Update: Append only new messages (Step 4)
      setMessages(prev => {
        const newOnes = data.messages.filter(
          (m: Message) => !prev.some(p => p.id === m.id)
        );
        if (newOnes.length === 0) return prev;
        
        const combined = [...prev, ...newOnes].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return combined;
      });

      if (isInitial) {
        setLoading(false);
        // Scroll to bottom on initial load
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
      }
    } catch (err: any) {
      console.error('Polling error:', err);
      if (isInitial) setError(err.message);
    }
  }, [conversationId, router]);

  useEffect(() => {
    fetchMessages(true);

    // Setup Polling (Step 3)
    pollingRef.current = setInterval(() => fetchMessages(), 5000);

    // Visibility Listener
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMessages();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMessages]);

  // Auto-scroll on new messages (Step 4)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMsg.id;
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  // ─── ACTIONS ──────────────────────────────────────────────────────

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || sending || !chatMeta?.canSendMore) return;

    setSending(true);
    const tempContent = content;
    setContent('');

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content: tempContent })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic update or wait for next poll
      fetchMessages();
    } catch (err: any) {
      if (err.message === 'UPGRADE_REQUIRED' || err.message === 'unlimited_messages') {
        openUpgradeModal('unlimited_messages', 'PRIME');
      } else {
        setError(err.message);
      }
      setContent(tempContent); // Restore on fail
    } finally {
      setSending(false);
    }
  };

  // ─── RENDER HELPERS (Step 5) ──────────────────────────────────────

  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId !== otherUser?.id;
    
    if (msg.type === 'SYSTEM') {
      return (
        <div key={msg.id} className="flex justify-center my-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
            {msg.content}
          </span>
        </div>
      );
    }

    if (msg.type === 'CONTACT_SHARE') {
      return (
        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-scale-in`}>
          <div className="max-w-[80%] glass-card p-4 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-3 mb-2 text-primary">
              <span className="material-symbols-outlined text-xl">contact_phone</span>
              <span className="font-bold text-sm">Contact Shared</span>
            </div>
            <p className="text-sm font-medium text-stone-800 break-words">{msg.content}</p>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 animate-scale-in`}>
        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
          isMe 
            ? 'bg-stone-900 text-white rounded-br-none' 
            : 'bg-white text-stone-800 border border-stone-100 rounded-bl-none'
        }`}>
          {msg.content}
          <div className={`text-[9px] mt-1 opacity-50 text-right ${isMe ? 'text-stone-300' : 'text-stone-400'}`}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────

  if (loading && !otherUser) {
    return (
      <div className="min-h-screen bg-[#F8F7F4]">
        <DashNav />
        <div className="max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col p-4">
          <div className="shimmer h-16 rounded-2xl mb-4" />
          <div className="flex-1 shimmer rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      <DashNav />
      
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col bg-white shadow-2xl shadow-stone-200 overflow-hidden md:my-4 md:rounded-[2.5rem] border border-stone-100">
        
        {/* Header (Step 2) */}
        <div className="p-4 border-b border-stone-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="material-symbols-outlined text-stone-400 hover:text-stone-900 transition-colors">
              arrow_back
            </Link>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-100">
              <img 
                src={otherUser?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.id}`} 
                alt={otherUser?.fullName} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm leading-none">{otherUser?.fullName}</h2>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Now
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg hover:bg-stone-50 text-stone-400 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-lg">flag</span>
            </button>
            <button className="w-8 h-8 rounded-lg hover:bg-stone-50 text-stone-400 flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined text-lg">block</span>
            </button>
          </div>
        </div>

        {/* Body (Step 2) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FDFDFD] hide-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
              <button onClick={() => fetchMessages(true)} className="ml-auto underline">Retry</button>
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <span className="material-symbols-outlined text-5xl mb-2">auto_awesome</span>
              <p className="text-sm font-medium">Start chatting after accepting interest</p>
            </div>
          )}

          {messages.map(renderMessage)}
          <div ref={scrollRef} />
        </div>

        {/* Footer & Plan Limits (Step 6) */}
        <div className="p-4 border-t border-stone-50 bg-white">
          {chatMeta && chatMeta.messageLimit !== Infinity && (
            <div className={`mb-4 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
              !chatMeta.canSendMore ? 'bg-primary/5 border border-primary/10' : 'bg-stone-50 border border-stone-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!chatMeta.canSendMore ? 'bg-primary/20 text-primary' : 'bg-stone-200 text-stone-500'}`}>
                  <span className="material-symbols-outlined text-sm">{!chatMeta.canSendMore ? 'lock' : 'chat_bubble'}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-stone-900 uppercase tracking-widest">
                    {chatMeta.messagesUsed} of {chatMeta.messageLimit} messages used
                  </p>
                  {!chatMeta.canSendMore && (
                    <p className="text-[9px] text-stone-500 font-medium mt-0.5">Free limit reached. Upgrade to continue.</p>
                  )}
                </div>
              </div>
              {!chatMeta.canSendMore && (
                <button 
                  onClick={() => openUpgradeModal('unlimited_messages', 'PRIME')}
                  className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest bg-white px-4 py-2 rounded-xl shadow-sm border border-primary/20"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <textarea 
              rows={1}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={chatMeta?.canSendMore ? "Type your message..." : "Daily limit reached"}
              disabled={!chatMeta?.canSendMore || sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-stone-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-stone-200 outline-none resize-none transition-all disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={!content.trim() || sending || !chatMeta?.canSendMore}
              className="w-11 h-11 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:bg-stone-200 disabled:scale-100"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xl">send</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
