'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';

export default function SearchPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fuzzyUsed, setFuzzyUsed] = useState(false);
  const [filters, setFilters] = useState({
    minAge: '',
    maxAge: '',
    city: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfiles = async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    setError(false);

    try {
      const params = new URLSearchParams();
      if (filters.minAge) params.set('minAge', filters.minAge);
      if (filters.maxAge) params.set('maxAge', filters.maxAge);
      if (filters.city) params.set('city', filters.city);
      
      // In a real app, we'd handle pagination on server
      // For this phase, we'll simulate load more if needed or just fetch all
      const res = await fetch(`/api/matches?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      
      const data = await res.json();
      
      if (isLoadMore) {
        setProfiles(prev => [...prev, ...data.profiles]);
      } else {
        setProfiles(data.profiles);
      }
      
      setFuzzyUsed(data.fuzzyUsed);
      // Simulating hasMore logic
      setHasMore(data.profiles.length > 0 && !isLoadMore); 

    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleFilterApply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProfiles();
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: "Excellent Match 💚", color: "text-green-600 bg-green-50 border-green-100" };
    if (score >= 60) return { text: "Good Match 💛", color: "text-yellow-600 bg-yellow-50 border-yellow-100" };
    if (score >= 40) return { text: "Possible Match 🔶", color: "text-orange-600 bg-orange-50 border-orange-100" };
    return { text: "Match", color: "text-stone-500 bg-stone-50 border-stone-100" };
  };

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  };

  return (
    <>
      <DashNav />
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="font-headline text-3xl font-bold text-stone-900">Find Your Match</h1>
            <p className="text-sm text-stone-500 mt-1">Discover profiles compatible with your preferences</p>
          </div>

          <form onSubmit={handleFilterApply} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 ml-1">Age Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-20 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={filters.minAge}
                  onChange={e => setFilters({...filters, minAge: e.target.value})}
                />
                <span className="text-stone-300">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-20 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={filters.maxAge}
                  onChange={e => setFilters({...filters, maxAge: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 ml-1">City</label>
              <input 
                type="text" 
                placeholder="Search city..." 
                className="w-40 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={filters.city}
                onChange={e => setFilters({...filters, city: e.target.value})}
              />
            </div>
            <button type="submit" className="bg-stone-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-stone-800 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">search</span>
              Apply
            </button>
          </form>
        </div>

        {/* Fuzzy Indicator */}
        {fuzzyUsed && profiles.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-700 animate-fade-in">
            <span className="material-symbols-outlined text-lg">info</span>
            <p className="text-xs font-medium">We expanded your search criteria to find more potential matches for you.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100">
            <span className="material-symbols-outlined text-5xl text-red-300 mb-4">error</span>
            <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
            <p className="text-red-600/70 mb-6">We couldn't load the profiles at this moment.</p>
            <button onClick={() => fetchProfiles()} className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all">
              Retry Connection
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && profiles.length === 0 && (
          <div className="text-center py-20 bg-stone-50 rounded-3xl border border-stone-100">
            <span className="material-symbols-outlined text-6xl text-stone-300 mb-4">person_search</span>
            <h2 className="font-headline text-2xl font-bold text-stone-800 mb-2">No profiles found</h2>
            <p className="text-stone-500 mb-8 max-w-xs mx-auto">Try broadening your filters or updating your partner preferences.</p>
            <button 
              onClick={() => {
                setFilters({ minAge: '', maxAge: '', city: '' });
                setTimeout(() => fetchProfiles(), 0);
              }} 
              className="btn-primary px-8 py-3 rounded-2xl"
            >
              Browse all profiles
            </button>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && !profiles.length ? (
            // Skeleton Placeholders
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm animate-pulse">
                <div className="h-64 bg-stone-100" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-stone-100 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                  <div className="h-8 bg-stone-100 rounded-xl w-full mt-4" />
                </div>
              </div>
            ))
          ) : (
            profiles.map((profile) => {
              const scoreLabel = getScoreLabel(profile.matchScore);
              const age = calculateAge(profile.dateOfBirth);
              
              return (
                <div key={profile.id} className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                  <div className="relative h-72 overflow-hidden bg-stone-100">
                    <img 
                      src={profile.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} 
                      alt={profile.fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm backdrop-blur-md ${scoreLabel.color}`}>
                        {scoreLabel.text}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-headline text-xl font-bold text-stone-900 leading-tight">
                          {profile.fullName}{age && `, ${age}`}
                        </h3>
                        <p className="text-stone-500 text-sm font-medium flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {profile.city}, {profile.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{profile.religion}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 mb-6">
                      <span className="px-3 py-1 bg-stone-50 text-stone-600 rounded-full text-[11px] font-semibold border border-stone-100">
                        {profile.occupation || profile.profession || "Professional"}
                      </span>
                      <span className="px-3 py-1 bg-stone-50 text-stone-600 rounded-full text-[11px] font-semibold border border-stone-100">
                        {profile.education || "Graduate"}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-primary text-white py-3 rounded-2xl text-xs font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">favorite</span>
                        Interest
                      </button>
                      <Link href={`/profile/${profile.userId}`} className="flex-1 bg-stone-100 text-stone-700 py-3 rounded-2xl text-xs font-bold hover:bg-stone-200 transition-all flex items-center justify-center">
                        View Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination / Load More */}
        {!loading && hasMore && profiles.length > 0 && (
          <div className="mt-12 text-center">
            <button 
              onClick={() => fetchProfiles(true)} 
              className="px-10 py-4 bg-white border border-stone-200 rounded-2xl text-sm font-bold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm"
            >
              Load More Profiles
            </button>
          </div>
        )}
      </div>
    </>
  );
}
