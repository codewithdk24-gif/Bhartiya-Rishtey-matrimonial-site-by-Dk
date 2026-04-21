'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';

interface NotifDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotifDropdown({ isOpen, onClose }: NotifDropdownProps) {
  const router = useRouter();
  const { resetUnread } = useNotifications();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Step 2: Fetch only on open (Lazy Load)
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifs();
    }
  }, [isOpen, notifications.length]);

  // Step 1: Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = async (notif: any) => {
    // Step 4: Mark as read + redirect
    if (!notif.isRead) {
      try {
        await fetch('/api/notifications/read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id })
        });
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    
    onClose();
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Step 5: Mark all as read
    resetUnread(); // Optimistic reset from context
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-14 right-0 w-[320px] md:w-[380px] bg-white rounded-[1.5rem] shadow-2xl border border-stone-100 overflow-hidden z-[60] animate-in fade-in zoom-in duration-200"
    >
      <div className="p-4 border-b border-stone-50 flex items-center justify-between">
        <h3 className="font-headline text-sm font-black text-stone-900 uppercase tracking-widest">Notifications</h3>
        <button 
          onClick={handleMarkAll}
          className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
        {loading ? (
          // Step 7: Skeleton Loading
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-stone-100 rounded w-3/4 animate-pulse" />
                  <div className="h-2 bg-stone-100 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          // Step 6: Empty State
          <div className="py-12 px-6 text-center">
            <span className="material-symbols-outlined text-4xl text-stone-100 mb-2">notifications_off</span>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-50">
            {notifications.map((n) => (
              <button 
                key={n.id} 
                onClick={() => handleNotifClick(n)}
                className={`w-full flex gap-3 p-4 text-left hover:bg-stone-50 transition-colors relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
              >
                {!n.isRead && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                )}
                
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-100 group-hover:scale-105 transition-transform">
                  <img 
                    src={n.fromUser?.profile?.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.fromUserId || n.id}`} 
                    alt="User" 
                    className="w-full h-full object-cover" 
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${!n.isRead ? 'text-stone-900 font-bold' : 'text-stone-600 font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-stone-50/50 border-t border-stone-50 text-center">
        <Link 
          href="/notifications" 
          onClick={onClose}
          className="text-[10px] font-black text-stone-400 hover:text-primary transition-colors uppercase tracking-widest"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
