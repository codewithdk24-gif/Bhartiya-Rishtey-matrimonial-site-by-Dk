'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function DashNav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const navLinks = [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { href: '/discover', icon: 'local_fire_department', label: 'For You' },
    { href: '/search', icon: 'search', label: 'Search' },
    { href: '/likes', icon: 'favorite', label: 'Likes' },
    { href: '/chat', icon: 'chat', label: 'Messages' },
    { href: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="font-headline text-lg font-bold text-stone-900 hidden sm:block">Bhartiya Rishtey</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-stone-600 hover:text-primary hover:bg-primary/5 transition-all font-medium"
            >
              <span className="material-symbols-outlined text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors">
            <span className="material-symbols-outlined text-stone-600">notifications</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-error hover:bg-error/5 transition-all font-medium">
            <span className="material-symbols-outlined text-lg">logout</span>
            <span className="hidden sm:block">Logout</span>
          </button>
          <button className="md:hidden p-2 rounded-xl hover:bg-stone-100" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="glass-card p-4 space-y-1 animate-fade-in-up">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-stone-600 hover:bg-primary/5 hover:text-primary transition-all font-medium" onClick={() => setMenuOpen(false)}>
                <span className="material-symbols-outlined text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [interests, setInterests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/notifications?limit=5').then(r => r.json()),
      fetch('/api/match/interest?type=received').then(r => r.json()),
    ]).then(([profileRes, notifRes, interestRes]) => {
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.profile);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.notifications ?? []);
      if (interestRes.status === 'fulfilled') setInterests(interestRes.value.matches ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <>
        <DashNav />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="space-y-6">
            {[1, 2, 3].map(i => <div key={i} className="shimmer h-32 rounded-2xl" />)}
          </div>
        </div>
      </>
    );
  }

  const completionPct = profile?.completionPct ?? 0;

  return (
    <>
      <DashNav />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in-up">
        {/* Welcome Banner */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-stone-900 mb-2">
              Welcome back, <span className="text-gradient">{profile?.fullName ?? 'User'}</span>
            </h1>
            <p className="text-stone-500 mb-6">Here&apos;s what&apos;s happening on your profile today.</p>

            {completionPct < 80 && (
              <div className="bg-gold/5 border border-gold/20 rounded-xl p-4 flex items-center gap-4 max-w-xl">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="transform -rotate-90 w-14 h-14" viewBox="0 0 36 36">
                    <path className="text-stone-200" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-gold" strokeDasharray={`${completionPct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-stone-700">{completionPct}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-700">Complete your profile to get better matches</p>
                  <Link href="/profile" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">Complete Now →</Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'favorite', label: 'Interests', value: interests.length, color: 'primary' },
            { icon: 'visibility', label: 'Profile Views', value: '—', color: 'gold' },
            { icon: 'bookmark', label: 'Shortlisted', value: '—', color: 'accent' },
            { icon: 'chat', label: 'Messages', value: '—', color: 'success' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 text-center glass-card-hover">
              <span className={`material-symbols-outlined text-2xl mb-2 block ${
                stat.color === 'primary' ? 'text-primary' :
                stat.color === 'gold' ? 'text-gold' :
                stat.color === 'success' ? 'text-success' :
                'text-accent'
              }`}>{stat.icon}</span>
              <p className="font-headline text-2xl font-bold text-stone-900">{stat.value}</p>
              <p className="text-xs text-stone-400 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Received Interests */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-xl font-bold text-stone-900">Received Interests</h2>
              <Link href="/search" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">View All</Link>
            </div>

            {interests.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl text-stone-300 mb-4 block">favorite_border</span>
                <p className="text-stone-400 font-medium">No interests yet</p>
                <p className="text-sm text-stone-400 mt-1">Complete your profile to attract more matches</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interests.slice(0, 5).map((match: any) => (
                  <div key={match.id} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 hover:bg-primary/5 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-900">{match.user1?.profile?.fullName ?? 'Someone'}</p>
                      <p className="text-xs text-stone-400">{match.user1?.profile?.profession ?? ''} • {match.user1?.profile?.location ?? ''}</p>
                    </div>
                    <span className="badge-premium">New</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-6">Notifications</h2>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-stone-300 mb-3 block">notifications_none</span>
                <p className="text-sm text-stone-400">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <div key={n.id} className={`p-3 rounded-xl text-sm ${n.isRead ? 'bg-stone-50' : 'bg-primary/5 border border-primary/10'}`}>
                    <p className="text-stone-700">{n.message}</p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/search', icon: 'search', label: 'Find Matches', color: 'from-primary to-primary-light' },
            { href: '/profile', icon: 'edit', label: 'Edit Profile', color: 'from-gold to-accent' },
            { href: '/chat', icon: 'chat', label: 'Messages', color: 'from-emerald-500 to-emerald-600' },
            { href: '/payment', icon: 'diamond', label: 'Upgrade Plan', color: 'from-amber-500 to-orange-500' },
          ].map((action, i) => (
            <Link key={i} href={action.href} className="group">
              <div className={`bg-gradient-to-br ${action.color} rounded-2xl p-5 text-white text-center transition-all hover:shadow-lg hover:scale-[1.02]`}>
                <span className="material-symbols-outlined text-3xl mb-2 block group-hover:scale-110 transition-transform">{action.icon}</span>
                <p className="text-sm font-bold">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
