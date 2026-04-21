'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useNotifications } from '@/context/NotificationContext';

interface Notification {
  id: string;
  userId: string;
  fromUserId?: string;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: {
    id: string;
    profile?: {
      fullName: string;
      profilePhoto: string;
    }
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const { resetUnread, setUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifs = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        const newNotifs = data.notifications || [];
        
        setNotifications(prev => isLoadMore ? [...prev, ...newNotifs] : newNotifs);
        setHasMore(data.pagination.page < data.pagination.totalPages);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchNotifs(1);
  }, [fetchNotifs]);

  const handleMarkAll = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        resetUnread();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        const res = await fetch('/api/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id })
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount);
          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
        }
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const groupNotifications = () => {
    const groups: { [key: string]: Notification[] } = {
      Today: [],
      Yesterday: [],
      Older: []
    };

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    notifications.forEach(n => {
      const d = new Date(n.createdAt).toDateString();
      if (d === today) groups.Today.push(n);
      else if (d === yesterday) groups.Yesterday.push(n);
      else groups.Older.push(n);
    });

    return groups;
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const groups = groupNotifications();

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      
      <main className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-black text-stone-900 tracking-tight">Notification Center</h1>
            <p className="text-sm text-stone-500 mt-1 font-medium">Keep track of your interactions and matches.</p>
          </div>
          <button 
            onClick={handleMarkAll}
            className="self-start md:self-center px-6 py-2.5 bg-white border border-stone-100 rounded-2xl text-xs font-black text-stone-600 uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm active:scale-95"
          >
            Mark all as read
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-4 bg-stone-200 rounded w-24 animate-pulse" />
                {[1, 2].map(j => (
                  <div key={j} className="shimmer h-24 rounded-[2rem]" />
                ))}
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-[3rem] py-24 px-6 text-center border border-stone-100 shadow-xl shadow-stone-200/50">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-stone-200">notifications_off</span>
            </div>
            <h3 className="text-xl font-bold text-stone-800">No notifications yet</h3>
            <p className="text-sm text-stone-400 mt-2 max-w-xs mx-auto">
              We'll let you know when someone interests you or sends a message.
            </p>
            <Link href="/discover" className="mt-8 inline-block bg-primary text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Discover Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groups).map(([title, items]) => items.length > 0 && (
              <div key={title} className="space-y-4">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] ml-4">{title}</h3>
                <div className="space-y-3">
                  {items.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full group relative bg-white border border-stone-100 rounded-[2rem] p-5 flex items-center gap-5 text-left transition-all hover:shadow-xl hover:-translate-y-1 ${!n.isRead ? 'shadow-md ring-2 ring-primary/5' : 'shadow-sm opacity-80'}`}
                    >
                      {!n.isRead && (
                        <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                      
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100 shadow-inner group-hover:scale-105 transition-transform">
                        <img 
                          src={n.fromUser?.profile?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.fromUserId || n.id}`} 
                          alt="User" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-stone-900 font-bold' : 'text-stone-600 font-medium'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>

                      <div className="material-symbols-outlined text-stone-200 group-hover:text-primary transition-colors">
                        chevron_right
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="pt-8 text-center">
                <button
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    fetchNotifs(next, true);
                  }}
                  disabled={loadingMore}
                  className="px-12 py-4 bg-stone-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-stone-200 disabled:bg-stone-400"
                >
                  {loadingMore ? 'Loading...' : 'Load More Notifications'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
