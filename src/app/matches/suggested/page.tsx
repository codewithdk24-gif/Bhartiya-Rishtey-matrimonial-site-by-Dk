'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';

const MOCK_MATCHES = [
  { id: '1', name: 'Ananya Sharma', age: 26, location: 'Mumbai, MH', profession: 'Interior Designer', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya' },
  { id: '2', name: 'Rohan Kapoor', age: 29, location: 'Pune, MH', profession: 'Software Engineer', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { id: '3', name: 'Priya Verma', age: 25, location: 'Delhi, DL', profession: 'Marketing Manager', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
  { id: '4', name: 'Arjun Mehta', age: 31, location: 'Bangalore, KA', profession: 'Data Scientist', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun' },
  { id: '5', name: 'Sneha Reddy', age: 27, location: 'Hyderabad, TS', profession: 'Architect', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha' },
  { id: '6', name: 'Vikram Singh', age: 30, location: 'Jaipur, RJ', profession: 'Business Owner', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram' },
];

export default function SuggestedMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState(MOCK_MATCHES);
  const [filters, setFilters] = useState({ age: '', location: '', profession: '' });

  const handleInterest = (id: string) => {
    alert(`Interest sent to profile ${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 selection:bg-rose-100">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 pb-32">
        
        {/* HEADER SECTION */}
        <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">Suggested Matches</h1>
            <p className="text-sm text-gray-500 font-medium">Profiles curated specifically based on your preferences and profile details.</p>
          </div>
          
          {/* SIMPLE FILTERS */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <select 
               className="bg-white border border-stone-200 text-xs font-bold px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-rose-500/20"
               value={filters.age}
               onChange={(e) => setFilters({...filters, age: e.target.value})}
             >
               <option value="">Age: All</option>
               <option value="20-25">20 - 25</option>
               <option value="26-30">26 - 30</option>
               <option value="31+">31+</option>
             </select>
             
             <select 
               className="bg-white border border-stone-200 text-xs font-bold px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-rose-500/20"
               value={filters.location}
               onChange={(e) => setFilters({...filters, location: e.target.value})}
             >
               <option value="">Location: All</option>
               <option value="mumbai">Mumbai</option>
               <option value="delhi">Delhi</option>
               <option value="pune">Pune</option>
             </select>

             <button 
               onClick={() => setMatches([])} // Simulate empty state for demo
               className="bg-stone-100 text-stone-600 p-2.5 rounded-full hover:bg-stone-200 transition-all"
               title="Clear Results"
             >
               <span className="material-symbols-outlined text-sm block">filter_list_off</span>
             </button>
          </div>
        </header>

        {/* MATCHES GRID */}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches.map((match) => (
              <div 
                key={match.id} 
                className="group bg-white rounded-[2rem] p-6 border border-stone-50 shadow-sm hover:shadow-xl hover:shadow-rose-100/10 transition-all duration-500 flex flex-col h-full"
              >
                {/* Profile Image */}
                <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden mb-6 bg-stone-50 shadow-inner">
                  <img 
                    src={match.photo} 
                    alt={match.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-rose-600 uppercase tracking-widest shadow-sm">
                    {match.age} Years
                  </div>
                </div>

                {/* Identity Info */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-stone-900 mb-1 group-hover:text-rose-600 transition-colors">
                    {match.name}
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-stone-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-rose-400">work</span>
                      {match.profession}
                    </p>
                    <p className="text-xs font-bold text-stone-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-rose-400">location_on</span>
                      {match.location}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto flex flex-col gap-3">
                  <button 
                    onClick={() => handleInterest(match.id)}
                    className="w-full bg-rose-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                  >
                    Send Interest
                  </button>
                  <Link 
                    href={`/profile/${match.id}`}
                    className="w-full bg-stone-50 text-stone-600 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-center hover:bg-stone-100 transition-all"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="text-center py-32 bg-white/40 rounded-[3rem] border-2 border-dashed border-rose-100 max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-rose-50 mx-auto mb-8">
              <span className="material-symbols-outlined text-6xl text-rose-200">person_search</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-4">No matches found</h2>
            <p className="text-stone-500 text-sm mb-10 max-w-xs mx-auto">Try updating your preferences or broadening your search criteria to find your perfect soulmate.</p>
            <button 
              onClick={() => router.push('/profile')}
              className="bg-stone-900 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-stone-200 hover:bg-black transition-all"
            >
              Update Preferences
            </button>
          </div>
        )}
        
      </main>
    </div>
  );
}
