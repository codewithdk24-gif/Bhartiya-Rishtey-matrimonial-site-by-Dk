'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';
import { formatLocation } from '@/lib/location';

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isMasked, setIsMasked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const { openUpgradeModal } = useModals();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user/${id}`);
        if (res.status === 404) {
          setError('User not found');
          return;
        }
        if (!res.ok) throw new Error('Failed to load profile');
        
        const data = await res.json();
        // Merge user into profile to satisfy existing frontend property access (e.g. profile.user.email)
        setProfile({ ...data.user.profile, user: data.user });
        setIsMasked(data.isMasked);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  const photos = useMemo(() => {
    if (!profile?.photos) return [];
    try {
      return JSON.parse(profile.photos);
    } catch { return []; }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf8f8]">
        <DashNav />
        <div className="max-w-5xl mx-auto px-4 pt-12 animate-pulse space-y-8">
           {/* Header Skeleton */}
           <div className="h-[500px] md:h-[600px] bg-stone-200 rounded-[3rem] shadow-xl" />
           {/* Content Skeleton */}
           <div className="bg-white rounded-[3rem] p-12 space-y-12">
              <div className="space-y-4">
                 <div className="h-10 w-2/3 bg-stone-100 rounded-xl" />
                 <div className="h-6 w-1/3 bg-stone-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="h-48 bg-stone-50 rounded-3xl" />
                 <div className="h-48 bg-stone-50 rounded-3xl" />
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdf8f8]">
        <DashNav />
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
             <span className="material-symbols-outlined text-4xl text-rose-300">error</span>
           </div>
           <h1 className="text-2xl font-black text-stone-900 mb-2">User not found</h1>
           <p className="text-sm text-stone-400 mb-8">{error}</p>
           <button onClick={() => router.back()} className="px-8 py-3 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-100 selection:bg-rose-100">
      <DashNav />
      
      <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white relative">
          
          {/* HEADER GALLERY SECTION */}
          <section className="relative h-[500px] md:h-[600px] bg-stone-100 group">
             {photos.length > 0 ? (
               <img 
                 src={photos[activePhotoIdx]} 
                 alt={profile.fullName} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-200">
                  <span className="material-symbols-outlined text-8xl">person</span>
               </div>
             )}
             
             {/* Gradient Overlays */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
             <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent z-10" />

             {/* Back Button */}
             <button onClick={() => router.back()} className="absolute top-8 left-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-stone-900 transition-all z-20 shadow-xl border border-white/20">
                <span className="material-symbols-outlined">arrow_back</span>
             </button>

             {/* Verified Badge */}
             <div className="absolute top-8 right-8 z-20 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white">
                <span className="material-symbols-outlined text-rose-500 fill-1 text-xl">verified</span>
                <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">Verified Member</span>
             </div>

             {/* Photo Selector */}
             {photos.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                   {photos.map((_, i) => (
                     <button 
                       key={i} 
                       onClick={() => setActivePhotoIdx(i)}
                       className={`h-1.5 rounded-full transition-all duration-300 ${i === activePhotoIdx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                     />
                   ))}
                </div>
             )}

             {/* Masking UI */}
             {isMasked && (
                <div className="absolute inset-0 z-10 bg-black/30 backdrop-blur-[4px] flex items-center justify-center">
                   <div className="text-center p-8 bg-white/10 backdrop-blur-xl border border-white/30 rounded-[3rem] shadow-2xl max-w-xs mx-4 transform group-hover:scale-105 transition-all">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-xl">
                         <span className="material-symbols-outlined text-3xl">lock</span>
                      </div>
                      <h3 className="text-lg font-black text-white mb-2 tracking-tight">Photos Masked</h3>
                      <p className="text-white/80 text-xs font-medium mb-8 leading-relaxed">Upgrade to Prime or Royal to see all photos of your matches.</p>
                      <button 
                        onClick={() => openUpgradeModal('unlimited_profiles', 'PRIME')}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
                      >
                         Upgrade Now
                      </button>
                   </div>
                </div>
             )}
          </section>

          {/* PROFILE INFO CONTENT */}
          <section className="relative z-20 bg-white rounded-t-[3rem] -mt-16 p-8 md:p-12">
             
             {/* IDENTITY SECTION */}
             <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div className="flex-1">
                   <h1 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-3">
                      {profile.fullName}, {profile.age || 'N/A'}
                   </h1>
                   <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-stone-500 font-bold text-sm">
                         <span className="material-symbols-outlined text-rose-500">work</span>
                         {profile.profession}
                      </div>
                      <div className="flex items-center gap-2 text-stone-500 font-bold text-sm">
                         <span className="material-symbols-outlined text-rose-500">location_on</span>
                         {formatLocation(profile)}
                      </div>
                      <div className="flex items-center gap-2 text-stone-500 font-bold text-sm">
                         <span className="material-symbols-outlined text-rose-500">church</span>
                         {profile.religion}
                      </div>
                   </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                   <button className="flex-1 md:flex-none px-10 py-4 bg-rose-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                      Interest <span className="material-symbols-outlined text-lg">favorite</span>
                   </button>
                   <button className="flex-1 md:flex-none w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm">
                      <span className="material-symbols-outlined">bookmark</span>
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* LEFT CONTENT COLUMN */}
                <div className="lg:col-span-8 space-y-12">
                   
                   {/* BIO SECTION */}
                   <div className="relative">
                      <div className="absolute -top-6 -left-6 text-rose-50 opacity-50 transform -rotate-12 select-none">
                         <span className="material-symbols-outlined text-9xl">format_quote</span>
                      </div>
                      <div className="relative z-10">
                         <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">About Me</h3>
                         <p className="text-lg text-stone-600 leading-relaxed font-medium italic">
                            &quot;{profile.bio || 'Finding my person to start a beautiful new chapter together. Looking for someone who values trust, family, and shared dreams.'}&quot;
                         </p>
                      </div>
                   </div>

                   {/* PERSONAL DETAILS GRID */}
                   <div className="space-y-8">
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-3">
                         <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
                         Personal Information
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                         {[
                           { label: 'Date of Birth', value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A', icon: 'cake' },
                           { label: 'Religion', value: profile.religion, icon: 'church' },
                           { label: 'Caste', value: profile.caste, icon: 'diversity_3' },
                           { label: 'Marital Status', value: profile.maritalStatus, icon: 'favorite' },
                           { label: 'Height', value: profile.heightCm ? `${profile.heightCm} cm` : 'N/A', icon: 'straighten' },
                           { label: 'Mother Tongue', value: profile.motherTongue || 'Hindi', icon: 'language' },
                         ].map((item, i) => (
                           <div key={i} className="space-y-2 group">
                              <div className="flex items-center gap-2 text-stone-300 group-hover:text-rose-400 transition-colors">
                                 <span className="material-symbols-outlined text-lg">{item.icon}</span>
                                 <p className="text-[9px] font-black uppercase tracking-widest">{item.label}</p>
                              </div>
                              <p className="text-sm font-bold text-stone-800 ml-7">{item.value || 'Not Disclosed'}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* PROFESSIONAL SECTION */}
                   <div className="space-y-8">
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-3">
                         <div className="w-1.5 h-5 bg-rose-500 rounded-full" />
                         Career & Education
                      </h3>
                      <div className="bg-stone-50 rounded-[2rem] p-8 border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex gap-5">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                               <span className="material-symbols-outlined">school</span>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Highest Education</p>
                               <p className="text-sm font-bold text-stone-800 leading-tight">{profile.education || 'Graduate'}</p>
                            </div>
                         </div>
                         <div className="flex gap-5">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                               <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Income Tier</p>
                               <p className="text-sm font-bold text-stone-800 leading-tight">{profile.incomeTier || 'Not Shared'}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                </div>

                {/* RIGHT SIDEBAR / CONTACT SECTION */}
                <div className="lg:col-span-4 space-y-8">
                   
                   {/* CONTACT CARD */}
                   <div className="bg-white rounded-[2.5rem] border border-rose-100 p-8 shadow-2xl shadow-rose-100/50 sticky top-24">
                      <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                         <span className="material-symbols-outlined text-rose-500">contact_mail</span>
                         Contact Details
                      </h3>
                      
                      {isMasked ? (
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <div className="flex items-center gap-4 opacity-30 grayscale select-none">
                                 <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400">
                                    <span className="material-symbols-outlined">alternate_email</span>
                                 </div>
                                 <p className="text-sm font-black tracking-widest">••••••••••••••</p>
                              </div>
                              <div className="flex items-center gap-4 opacity-30 grayscale select-none">
                                 <div className="w-10 h-10 bg-stone-50 rounded-full flex items-center justify-center text-stone-400">
                                    <span className="material-symbols-outlined">call</span>
                                 </div>
                                 <p className="text-sm font-black tracking-widest">+91 ••••• •••••</p>
                              </div>
                           </div>
                           
                           <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 text-center">
                              <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-4">Royal Exclusive</p>
                              <p className="text-xs text-stone-500 font-medium mb-6 leading-relaxed">Get direct contact details and express interest immediately.</p>
                              <button 
                                onClick={() => openUpgradeModal('contact_share', 'ROYAL')}
                                className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
                              >
                                Reveal Now
                              </button>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                                 <span className="material-symbols-outlined">alternate_email</span>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                 <p className="text-sm font-bold text-stone-800">{profile.user?.email || 'Shared via Interest'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                                 <span className="material-symbols-outlined">call</span>
                              </div>
                              <div>
                                 <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                                 <p className="text-sm font-bold text-stone-800">{profile.user?.phone || 'Shared via Interest'}</p>
                              </div>
                           </div>
                        </div>
                      )}
                   </div>

                   {/* TRUST SECTION */}
                   <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -bottom-8 -right-8 text-white/5 transform -rotate-12 transition-transform group-hover:rotate-0 duration-700">
                         <span className="material-symbols-outlined text-[10rem]">verified_user</span>
                      </div>
                      <div className="relative z-10">
                         <h3 className="text-lg font-black mb-2 flex items-center gap-3 text-rose-500">
                            <span className="material-symbols-outlined text-2xl">security</span>
                            Safety First
                         </h3>
                         <p className="text-stone-400 text-xs font-medium leading-relaxed mb-8">
                            We manually verify every profile to ensure a secure matchmaking experience. 
                         </p>
                         <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Report Profile</button>
                      </div>
                   </div>

                </div>

             </div>

          </section>

        </div>
      </main>

      {/* STICKY BOTTOM ACTION BAR (Mobile/Tablet) */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-xl border-t border-rose-50 z-[100] md:hidden">
         <div className="flex gap-4">
            <button className="flex-1 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-200">Express Interest</button>
            <button className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><span className="material-symbols-outlined">bookmark</span></button>
         </div>
      </div>

    </div>
  );
}
