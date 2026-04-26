'use client';

import React, { useEffect } from 'react';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    gender: string;
    dateOfBirth: string;
    heightCm: string;
    religion: string;
    caste: string;
    location: string;
    education: string;
    profession: string;
    incomeTier: string;
    bio: string;
    photos: string[];
  };
}

export default function ProfilePreviewModal({ isOpen, onClose, profile }: ProfilePreviewModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const age = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const primaryPhoto = profile.photos[0] || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder';

  return (
    <div className="fixed inset-0 z-[500] bg-white overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom duration-500 flex flex-col items-center">
      
      {/* Constraints for wide screens while keeping full screen feel */}
      <div className="w-full max-w-2xl bg-white min-h-screen flex flex-col relative">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-[60] w-full px-4 py-4 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-stone-100">
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-all active:scale-90"
           >
             <span className="material-symbols-outlined text-xl">arrow_back</span>
           </button>
           
           <div className="flex flex-col items-center">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 leading-none">Preview Mode</p>
              <p className="text-[8px] font-bold text-stone-400 mt-1 uppercase tracking-widest">How others see you</p>
           </div>
           
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center"
           >
             <span className="material-symbols-outlined text-xl">close</span>
           </button>
        </div>

        {/* Floating Context Label */}
        <div className="absolute top-24 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-stone-900/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
             <span className="material-symbols-outlined text-rose-400 text-sm">visibility</span>
             <span className="text-[8px] font-black uppercase tracking-[0.15em] text-white">Public Profile View</span>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="relative w-full h-[65vh] bg-stone-50 overflow-hidden">
          <img 
            src={primaryPhoto} 
            className="w-full h-full object-cover object-center" 
            alt={profile.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-10 left-6 right-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-black tracking-tight">{profile.name}, {age(profile.dateOfBirth)}</h2>
              <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.9)] animate-pulse" />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {profile.location || 'Location hidden'}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                <span className="material-symbols-outlined text-xs">work</span>
                {profile.profession || 'Professional'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-t-[2.5rem] -mt-6 p-6 pb-24 space-y-10 relative z-10">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Religion', value: profile.religion, icon: 'temple_hindu' },
              { label: 'Height', value: profile.heightCm ? `${profile.heightCm} cm` : '', icon: 'straighten' },
              { label: 'Income', value: profile.incomeTier, icon: 'payments' },
              { label: 'Education', value: profile.education, icon: 'school' }
            ].map((stat, i) => (
              <div key={i} className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm">
                  <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                  <p className="text-xs font-bold text-stone-900 truncate">{stat.value || 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">notes</span>
              About Me
            </h3>
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 italic relative">
               <span className="absolute -top-3 -left-1 text-5xl text-rose-100 opacity-50 font-serif">"</span>
               <p className="text-sm text-stone-600 leading-relaxed font-medium">
                 {profile.bio || 'Sharing my story soon...'}
               </p>
            </div>
          </div>

          {/* Photos Gallery */}
          {profile.photos.length > 1 && (
            <div>
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">collections</span>
                Gallery
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {profile.photos.slice(1).map((p, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-stone-100 group shadow-sm">
                    <img 
                      src={p} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt="" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Badge */}
          <div className="flex items-center gap-4 p-5 bg-rose-50/50 rounded-3xl border border-rose-100/50">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
               <span className="material-symbols-outlined text-2xl fill-1">verified</span>
             </div>
             <div>
               <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">Identity Verified</h4>
               <p className="text-[9px] font-bold text-stone-400 mt-0.5">Verified by Bhartiya Rishtey Trust System</p>
             </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-50 w-full p-4 bg-white/80 backdrop-blur-xl border-t border-stone-100">
           <button className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95">
             Send Interest Request
           </button>
        </div>
      </div>
    </div>
  );
}
