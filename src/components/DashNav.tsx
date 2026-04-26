import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { handleLogout } from '@/lib/logout';
import { useNotifications } from '@/context/NotificationContext';
import { useModals } from '@/context/ModalContext';
import NotifDropdown from './NotifDropdown';

export default function DashNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount, resetUnread } = useNotifications();
  const { openUpgradeModal } = useModals();

  const [prevCount, setPrevCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch profile photo
  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data?.profile?.profilePhoto) {
            setProfilePhoto(data.profile.profilePhoto);
          }
        })
        .catch(err => console.error("Error fetching profile photo:", err));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (unreadCount > prevCount) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevCount(unreadCount);
  }, [unreadCount, prevCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCount = (count: number) => {
    if (count <= 0) return null;
    if (count > 99) return '99+';
    return count;
  };

  const navLinks = [
    { href: '/dashboard', icon: 'home', label: 'Home' },
    { href: '/discover', icon: 'local_fire_department', label: 'Discover' },
    { href: '/matches', icon: 'handshake', label: 'Matches' },
    { href: '/chat', icon: 'chat', label: 'Messages' },
    { href: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <>
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold text-[#9b1c31] block tracking-tight">Bhartiya Rishtey</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${pathname === link.href
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
            <button
              onClick={() => router.push('/payment')}
              className="p-2 rounded-xl hover:bg-gold/10 transition-colors group flex items-center justify-center relative"
              title="Upgrade to Premium"
            >
              <span className="material-symbols-outlined text-gold group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">diamond</span>
            </button>

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

            {/* Profile Avatar Dropdown */}
            <div className="relative ml-1" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 border-2 border-white shadow-sm hover:scale-105 active:scale-95 transition-all overflow-hidden"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="User" className="w-full h-full object-cover" />
                ) : session?.user?.image ? (
                  <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-black text-stone-400">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
                {/* Online Indicator */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 py-2.5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-stone-50 mb-1.5">
                    <p className="text-[11px] font-black text-stone-300 uppercase tracking-widest leading-tight">Signed in as</p>
                    <p className="text-sm font-black text-stone-900 truncate">{session?.user?.name || 'Premium Member'}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-stone-600 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">account_circle</span>
                    <span className="text-xs font-bold">View Profile</span>
                  </Link>

                  <Link
                    href="/profile/edit"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-stone-600 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    <span className="text-xs font-bold">Edit Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-stone-600 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    <span className="text-xs font-bold">Settings</span>
                  </Link>

                  <div className="h-px bg-stone-50 my-1.5 mx-3" />

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    <span className="text-xs font-bold">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl">logout</span>
            </div>
            <h3 className="text-xl font-black text-stone-900 text-center mb-2">Logout?</h3>
            <p className="text-stone-500 text-sm text-center mb-8">Are you sure you want to end your session? We'll miss you! ❤️</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="py-4 bg-stone-100 text-stone-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
              >
                Stay here
              </button>
              <button 
                onClick={handleLogout}
                className="py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-[100] flex justify-around items-center h-16">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-all ${pathname === link.href ? 'text-primary' : 'text-stone-400'
              }`}
          >
            <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all ${pathname === link.href ? 'bg-primary/10' : 'hover:bg-stone-50'}`}>
              <span className={`material-symbols-outlined text-[28px] ${pathname === link.href ? 'fill-1' : ''}`}>
                {link.icon}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
