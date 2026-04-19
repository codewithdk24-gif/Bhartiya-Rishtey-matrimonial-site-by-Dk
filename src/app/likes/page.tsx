'use client';

import { useState, useEffect } from 'react';
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
              <Link key={link.h} href={link.h} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${link.h === '/likes' ? 'text-primary bg-primary/5' : 'text-stone-500 hover:text-primary hover:bg-primary/5'}`}>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-50 px-2 py-1 flex justify-around">
        {links.map(link => (
          <Link key={link.h} href={link.h} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${link.h === '/likes' ? 'text-primary' : 'text-stone-400'}`}>
            <span className="material-symbols-outlined text-xl">{link.i}</span>{link.l}
          </Link>
        ))}
      </div>
    </>
  );
}

export default function LikesPage() {
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      fetch('/api/match/interest?type=received').then(r => r.json()),
      fetch('/api/payment/status').then(r => r.json()),
    ]).then(([likesRes, paymentRes]) => {
      if (likesRes.status === 'fulfilled') setLikes(likesRes.value.matches ?? []);
      if (paymentRes.status === 'fulfilled') {
        setIsPremium(paymentRes.value.status === 'APPROVED' || paymentRes.value.tier === 'PREMIUM' || paymentRes.value.tier === 'ROYAL');
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <>
        <DashNav />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer h-64 rounded-2xl" />)}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashNav />
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-stone-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">favorite</span>
              Who Liked You
            </h1>
            <p className="text-sm text-stone-400 mt-1">
              {likes.length} {likes.length === 1 ? 'person' : 'people'} liked your profile
            </p>
          </div>
          {!isPremium && likes.length > 0 && (
            <Link href="/payment" className="btn-gold text-xs px-4 py-2">
              <span className="material-symbols-outlined text-sm">lock_open</span>
              Unlock All
            </Link>
          )}
        </div>

        {/* Premium Banner */}
        {!isPremium && likes.length > 0 && (
          <div className="glass-card p-6 mb-6 bg-gradient-to-r from-gold/5 to-primary/5 border border-gold/20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl text-gold">diamond</span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-stone-900">Upgrade to see who likes you</h3>
                <p className="text-sm text-stone-500">Get Premium to see full profiles and connect with people who are already interested in you.</p>
              </div>
              <Link href="/payment" className="btn-gold text-xs px-5 py-2.5 flex-shrink-0 hidden sm:block">
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {likes.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-7xl text-stone-300 mb-4 block">favorite_border</span>
            <h2 className="font-headline text-2xl font-bold text-stone-700 mb-2">No likes yet</h2>
            <p className="text-stone-500 max-w-md mx-auto mb-6">
              Complete your profile and add photos to start getting likes from interested people.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/profile" className="btn-secondary text-sm px-5 py-2.5">Update Profile</Link>
              <Link href="/discover" className="btn-primary text-sm px-5 py-2.5">Explore Matches</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {likes.map((match: any, idx: number) => {
              const profile = match.user1?.profile;
              const name = profile?.fullName ?? 'Someone';
              let photos: string[] = [];
              try { photos = JSON.parse(profile?.photos ?? '[]'); } catch { photos = []; }

              return (
                <div key={match.id} className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all">
                  {/* Photo / Placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-gold/10 relative">
                    {photos.length > 0 ? (
                      <img
                        src={photos[0]}
                        alt={isPremium ? name : 'Hidden'}
                        className={`w-full h-full object-cover ${!isPremium ? 'blur-xl scale-110' : ''}`}
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${!isPremium ? 'blur-lg' : ''}`}>
                        <span className="material-symbols-outlined text-6xl text-primary/20">person</span>
                      </div>
                    )}

                    {/* Blur overlay for free users */}
                    {!isPremium && (
                      <div className="absolute inset-0 backdrop-blur-md bg-white/30 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-primary mb-2">lock</span>
                        <p className="text-sm font-bold text-stone-700">Upgrade to reveal</p>
                      </div>
                    )}

                    {/* Gradient bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

                    {/* Name */}
                    <div className="absolute bottom-3 left-3 right-3">
                      {isPremium ? (
                        <>
                          <p className="text-white font-bold text-lg drop-shadow">{name}</p>
                          <p className="text-white/70 text-xs">{profile?.profession ?? ''} • {profile?.location ?? ''}</p>
                        </>
                      ) : (
                        <p className="text-white font-bold text-lg drop-shadow blur-sm select-none">Hidden Profile</p>
                      )}
                    </div>

                    {/* Heart badge */}
                    <div className="absolute top-3 right-3">
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-white text-lg">favorite</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
