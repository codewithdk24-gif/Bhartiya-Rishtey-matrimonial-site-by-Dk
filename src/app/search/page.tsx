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
              <Link key={link.h} href={link.h} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${link.h === '/search' ? 'text-primary bg-primary/5' : 'text-stone-500 hover:text-primary hover:bg-primary/5'}`}>
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
          <Link key={link.h} href={link.h} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all ${link.h === '/search' ? 'text-primary' : 'text-stone-400'}`}>
            <span className="material-symbols-outlined text-xl">{link.i}</span>{link.l}
          </Link>
        ))}
      </div>
    </>
  );
}

export default function SearchPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});
  const [sendingInterest, setSendingInterest] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    religion: '',
    location: '',
    minAge: '',
    maxAge: '',
    profession: '',
    education: '',
  });

  const fetchMatches = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' });
      if (filters.religion) params.set('religion', filters.religion);
      if (filters.location) params.set('location', filters.location);
      if (filters.minAge) params.set('minAge', filters.minAge);
      if (filters.maxAge) params.set('maxAge', filters.maxAge);
      if (filters.profession) params.set('profession', filters.profession);
      if (filters.education) params.set('education', filters.education);

      const res = await fetch(`/api/matches?${params.toString()}`);
      const data = await res.json();

      let filtered = data.matches ?? [];
      // Client-side filtering as backup
      if (filters.religion) filtered = filtered.filter((m: any) => m.religion?.toLowerCase().includes(filters.religion.toLowerCase()));
      if (filters.location) filtered = filtered.filter((m: any) => m.location?.toLowerCase().includes(filters.location.toLowerCase()));
      if (filters.profession) filtered = filtered.filter((m: any) => m.profession?.toLowerCase().includes(filters.profession.toLowerCase()));
      if (filters.education) filtered = filtered.filter((m: any) => m.education?.toLowerCase().includes(filters.education.toLowerCase()));
      if (filters.minAge || filters.maxAge) {
        filtered = filtered.filter((m: any) => {
          if (!m.dateOfBirth) return true;
          const age = Math.floor((Date.now() - new Date(m.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (filters.minAge && age < parseInt(filters.minAge)) return false;
          if (filters.maxAge && age > parseInt(filters.maxAge)) return false;
          return true;
        });
      }

      setMatches(filtered);
      setMeta(data.meta ?? {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(page); }, [page]);

  const applyFilters = () => {
    setPage(1);
    fetchMatches(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ religion: '', location: '', minAge: '', maxAge: '', profession: '', education: '' });
    setPage(1);
    setTimeout(() => fetchMatches(1), 0);
    setShowFilters(false);
  };

  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const sendInterest = async (targetUserId: string) => {
    setSendingInterest(prev => new Set(prev).add(targetUserId));
    try {
      await fetch('/api/match/interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      setMatches(prev => prev.filter(m => m.userId !== targetUserId));
    } catch (err) { console.error(err); }
    finally { setSendingInterest(prev => { const s = new Set(prev); s.delete(targetUserId); return s; }); }
  };

  const getPhotos = (p: string) => { try { const arr = JSON.parse(p ?? '[]'); return Array.isArray(arr) ? arr : []; } catch { return []; } };

  return (
    <>
      <DashNav />
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-headline text-3xl font-bold text-stone-900">Search Matches</h1>
            <p className="text-sm text-stone-500 mt-1">{matches.length} profiles found</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeFilterCount > 0 ? 'bg-primary text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            <span className="material-symbols-outlined text-lg">tune</span>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="glass-card p-6 mb-6 animate-fade-in-up">
            <h3 className="font-headline text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">filter_list</span>
              Filter Preferences
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Religion</label>
                <select className="input-field text-sm" value={filters.religion} onChange={e => setFilters({...filters, religion: e.target.value})}>
                  <option value="">Any Religion</option>
                  {['Hindu', 'Muslim', 'Sikh', 'Christian', 'Buddhist', 'Jain'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Location</label>
                <input className="input-field text-sm" placeholder="e.g., Mumbai" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Profession</label>
                <input className="input-field text-sm" placeholder="e.g., Engineer" value={filters.profession} onChange={e => setFilters({...filters, profession: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Min Age</label>
                <input type="number" className="input-field text-sm" placeholder="21" value={filters.minAge} onChange={e => setFilters({...filters, minAge: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Max Age</label>
                <input type="number" className="input-field text-sm" placeholder="35" value={filters.maxAge} onChange={e => setFilters({...filters, maxAge: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">Education</label>
                <input className="input-field text-sm" placeholder="e.g., MBA" value={filters.education} onChange={e => setFilters({...filters, education: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3 mt-4 justify-end">
              <button onClick={clearFilters} className="btn-secondary text-xs px-4 py-2">Clear All</button>
              <button onClick={applyFilters} className="btn-primary text-xs px-5 py-2">Apply Filters</button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="shimmer h-80 rounded-2xl" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-7xl text-stone-300 mb-4 block">search_off</span>
            <h2 className="font-headline text-2xl font-bold text-stone-700 mb-2">No matches found</h2>
            <p className="text-stone-500 max-w-md mx-auto mb-4">{activeFilterCount > 0 ? 'Try adjusting your filters for more results.' : 'Complete your profile to discover compatible matches.'}</p>
            {activeFilterCount > 0 && <button onClick={clearFilters} className="btn-primary text-sm px-5 py-2.5">Clear Filters</button>}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matches.map((match: any) => {
                const photos = getPhotos(match.photos);
                const age = match.dateOfBirth ? Math.floor((Date.now() - new Date(match.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

                return (
                  <div key={match.id} className="profile-card group">
                    <div className="relative h-52 bg-gradient-to-br from-primary/10 to-gold/10 flex items-center justify-center overflow-hidden">
                      {photos[0] ? (
                        <img src={photos[0]} alt={match.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-primary/20">person</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          match.matchScore >= 90 ? 'bg-success text-white' : match.matchScore >= 75 ? 'bg-primary text-white' : 'bg-gold text-white'
                        }`}>{match.matchScore}% Match</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-headline text-lg font-bold text-stone-900">
                        {match.fullName}{age ? `, ${age}` : ''}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {match.profession && <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{match.profession}</span>}
                        {match.location && <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">📍 {match.location}</span>}
                        {match.religion && <span className="text-[11px] bg-gold/10 text-gold px-2 py-0.5 rounded-full">{match.religion}</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => sendInterest(match.userId)} disabled={sendingInterest.has(match.userId)} className="btn-primary flex-1 text-xs py-2">
                          {sendingInterest.has(match.userId) ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <><span className="material-symbols-outlined text-sm">favorite</span> Like</>
                          )}
                        </button>
                        <button className="p-2 rounded-xl border border-stone-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <span className="material-symbols-outlined text-sm text-stone-500">bookmark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs px-5 py-2 disabled:opacity-40">← Previous</button>
              <span className="px-4 py-2 text-sm font-medium text-stone-500">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={matches.length < 12} className="btn-secondary text-xs px-5 py-2 disabled:opacity-40">Next →</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
