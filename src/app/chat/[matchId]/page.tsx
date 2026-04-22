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
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (matchId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for simplicity
      return () => clearInterval(interval);
    }
  }, [matchId]);

  useEffect(scrollToBottom, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`);
      if (res.status === 403) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

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
        fetchMessages();
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <DashNav />
        <div className="max-w-2xl mx-auto p-4 flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <DashNav />
      
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col bg-white shadow-sm overflow-hidden md:my-4 md:rounded-[2rem] border border-stone-100">
        {/* Chat Header */}
        <div className="p-4 border-b border-stone-50 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <Link href="/likes" className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <span className="material-symbols-outlined text-stone-400">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {/* User Avatar Placeholder */}
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <h1 className="font-bold text-stone-800 text-sm">Conversation</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/30">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-rose-300">
                <span className="material-symbols-outlined text-3xl">chat_bubble</span>
              </div>
              <h2 className="text-stone-800 font-bold mb-1">Start a conversation</h2>
              <p className="text-xs text-stone-400">Be the first to say hi! Good luck ❤️</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                    isMine 
                      ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/10' 
                      : 'bg-white text-stone-700 rounded-tl-none border border-stone-100 shadow-sm'
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1.5 ${isMine ? 'text-white/60' : 'text-stone-300'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-stone-50 flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-stone-50 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
