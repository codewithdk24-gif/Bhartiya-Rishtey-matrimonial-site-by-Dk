'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  resetUnread: () => void;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    // Only fetch if tab is active to save resources
    if (document.visibilityState !== 'visible') return;

    try {
      // Step 3: Minimal fetch (limit=1, unreadOnly=true)
      const res = await fetch('/api/notifications?limit=1&unreadOnly=true', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        // Step 7: Error handling - keep last count if API fails or returns unexpected data
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      // Silent fail
      console.warn('Notification Polling Error:', err);
    }
  }, []);

  const resetUnread = useCallback(async () => {
    // Step 5: Optimistic Reset
    setUnreadCount(0);
    try {
      await fetch('/api/notifications/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();

    // Step 3 & 4: Polling with visibility control
    pollingRef.current = setInterval(fetchUnreadCount, 10000); // 10 seconds for live feel

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, resetUnread, fetchUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
