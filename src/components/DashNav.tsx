'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { handleLogout } from '@/lib/logout';
import { useNotifications } from '@/context/NotificationContext';
import NotifDropdown from './NotifDropdown';

export default function DashNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount, resetUnread } = useNotifications();
  const [prevCount, setPrevCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (unreadCount > prevCount) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);


  const formatCount = (count: number) => {
    if (count <= 0) return null;
    if (count > 99) return '99+';
    return count;
  };

  // User requested exactly 5 items: Home, Discover, Search, Message, Profile
  const navLinks = [
    { href: '/dashboard', icon: 'home', label: 'Home' },
    { href: '/discover', icon: 'local_fire_department', label: 'Discover' },
    { href: '/matches', icon: 'handshake', label: 'Matches' },
    { href: '/search', icon: 'search', label: 'Search' },
    { href: '/chat', icon: 'chat', label: 'Messages' },
    { href: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <>
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold text-[#9b1c31] hidden sm:block tracking-tight">Bhartiya Rishtey</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href 
                    ? 'text-primary bg-primary/5' 
                    : 'text-stone-500 hover:text-primary hover:bg-primary/5'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-xl hover:bg-primary/5 transition-all group ${isShaking ? 'animate-bell-shake' : ''}`}
                title="Notifications"
              >
                <span className={`material-symbols-outlined text-[22px] transition-colors ${unreadCount > 0 ? 'text-primary fill-1' : 'text-stone-400 group-hover:text-primary'}`}>
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[9px] font-black min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border-2 border-white">
                    {formatCount(unreadCount)}
                  </span>
                )}
              </button>
              
              <NotifDropdown 
                isOpen={isNotifOpen} 
                onClose={() => setIsNotifOpen(false)} 
              />
            </div>

            <Link 
              href="/payment" 
              className="p-2 rounded-xl hover:bg-gold/10 transition-colors group"
              title="Premium"
            >
              <span className="material-symbols-outlined text-gold group-hover:scale-110 transition-transform">diamond</span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-xl text-stone-400 hover:text-error hover:bg-error/5 transition-all"
              title="Logout"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-[100] px-1 py-1 flex justify-around items-center h-16">
        {navLinks.map(link => (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all ${
              pathname === link.href ? 'text-primary' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className={`w-12 h-8 flex items-center justify-center rounded-2xl transition-all ${pathname === link.href ? 'bg-primary/10' : ''}`}>
              <span className={`material-symbols-outlined text-[22px] min-[360px]:text-[24px] ${pathname === link.href ? 'fill-1' : ''}`}>
                {link.icon}
              </span>
            </div>
            <span className="text-[9px] min-[360px]:text-[10px] font-bold tracking-tight uppercase">{link.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
