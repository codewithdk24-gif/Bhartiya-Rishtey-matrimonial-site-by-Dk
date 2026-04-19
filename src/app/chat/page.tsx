'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function DashNav() {
  const router = useRouter();
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };
  const links = [
    { h: '/dashboard', i: 'dashboard', l: 'Dashboard' },
    { h: '/discover', i: 'local_fire_department', l: 'For You' },
    { h: '/search', i: 'search', l: 'Search' },
    { h: '/likes', i: 'favorite', l: 'Likes' },
    { h: '/chat', i: 'chat', l: 'Messages' },
    { h: '/profile', i: 'person', l: 'Profile' },
  ];
  return (
    <>
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold text-stone-900 hidden sm:block">Bhartiya Rishtey</span>
          </Link>
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(link => (
              <Link key={link.h} href={link.h} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${link.h === '/chat' ? 'text-primary bg-primary/5' : 'text-stone-500 hover:text-primary hover:bg-primary/5'}`}>
                <span className="material-symbols-outlined text-lg">{link.i}</span>{link.l}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/payment" className="p-2 rounded-xl hover:bg-gold/10 transition-colors"><span className="material-symbols-outlined text-gold">diamond</span></Link>
            <button onClick={handleLogout} className="p-2 rounded-xl text-stone-400 hover:text-error hover:bg-error/5 transition-all"><span className="material-symbols-outlined text-lg">logout</span></button>
          </div>
        </div>
      </nav>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-50 px-1 py-1 flex justify-around">
        {links.map(link => (
          <Link key={link.h} href={link.h} className={`flex flex-col items-center gap-0 px-1 py-1.5 rounded-xl text-[8px] min-[360px]:text-[10px] font-medium transition-all ${link.h === '/chat' ? 'text-primary' : 'text-stone-400'}`}>
            <span className="material-symbols-outlined text-lg min-[360px]:text-xl">{link.i}</span>
            <span className="whitespace-nowrap">{link.l}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

interface Conversation {
  userId: string;
  fullName: string | null;
  photo: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(data => {
        setConversations(data.conversations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetch(`/api/messages?chatWith=${selectedChat}`)
        .then(r => r.json())
        .then(data => setMessages(data.messages ?? []))
        .catch(console.error);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedChat) return;
    setSendingMsg(true);
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedChat, content: newMsg.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, data.data]);
        setNewMsg('');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const openChat = (conv: Conversation) => {
    setSelectedChat(conv.userId);
    setSelectedName(conv.fullName ?? 'User');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <>
      <DashNav />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="glass-card h-full flex overflow-hidden">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'w-full md:w-80' : 'hidden md:block md:w-80'} border-r border-stone-200/50 flex flex-col`}>
            <div className="p-4 border-b border-stone-200/50">
              <h2 className="font-headline text-xl font-bold text-stone-900">Messages</h2>
              <p className="text-xs text-stone-400 mt-1">{conversations.length} conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="shimmer h-16 rounded-xl" />)}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <span className="material-symbols-outlined text-5xl text-stone-300 mb-3 block">forum</span>
                  <p className="text-sm text-stone-400">No conversations yet</p>
                  <Link href="/search" className="text-sm font-bold text-primary mt-2 block">Find matches to chat with</Link>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => openChat(conv)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-primary/5 transition-colors ${
                      selectedChat === conv.userId ? 'bg-primary/5 border-r-2 border-primary' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {conv.photo ? (
                        <img src={conv.photo} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary">person</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm truncate ${conv.unread ? 'text-stone-900' : 'text-stone-700'}`}>
                          {conv.fullName ?? 'User'}
                        </p>
                        <p className="text-[10px] text-stone-400 flex-shrink-0">
                          {new Date(conv.lastMessageTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unread ? 'text-stone-700 font-medium' : 'text-stone-400'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread && <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${!sidebarOpen || selectedChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-stone-200/50 flex items-center gap-3">
                  <button onClick={() => { setSidebarOpen(true); setSelectedChat(null); }} className="md:hidden p-1">
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{selectedName}</p>
                    <p className="text-xs text-success">Online</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === selectedChat ? 'justify-start' : 'justify-end'}`}>
                      <div className={msg.senderId === selectedChat ? 'chat-bubble-received' : 'chat-bubble-sent'}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderId === selectedChat ? 'text-stone-400' : 'text-white/60'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-stone-200/50">
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1"
                      placeholder="Type a message..."
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      maxLength={1000}
                    />
                    <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()} className="btn-primary px-5">
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-7xl text-stone-300 mb-4 block">chat_bubble_outline</span>
                  <h3 className="font-headline text-xl font-bold text-stone-700 mb-2">Select a conversation</h3>
                  <p className="text-sm text-stone-400">Choose a conversation from the sidebar to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
