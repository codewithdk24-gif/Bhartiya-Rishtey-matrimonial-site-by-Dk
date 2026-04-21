'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useModals } from '@/context/ModalContext';

export default function ProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isMasked, setIsMasked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { openUpgradeModal } = useModals();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${id}`);
        
        if (res.status === 404) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error('Failed to load profile');
        
        const data = await res.json();
        setProfile(data.profile);
        setIsMasked(data.isMasked);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4]">
        <DashNav />
        <div className="max-w-2xl mx-auto px-4 pt-12">
          <div className="shimmer h-[600px] rounded-[3rem]" />
        </div>
      </div>
    );
  }

  if (error === 'Profile not found') {
    return (
      <div className="min-h-screen bg-[#F8F7F4]">
        <DashNav />
        <div className="max-w-md mx-auto px-4 pt-24 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="material-symbols-outlined text-4xl text-stone-200">person_off</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mb-2">Profile not found</h1>
          <p className="text-sm text-stone-400 mb-8 font-medium">This profile is either private or does not exist.</p>
          <button onClick={() => router.back()} className="btn-primary px-10">Go Back</button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7F4]">
        <DashNav />
        <div className="max-w-md mx-auto px-4 pt-24 text-center text-error">
          <p className="font-bold">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-stone-200/50 overflow-hidden border border-stone-100">
          {/* Header Image */}
          <div className="h-80 bg-stone-100 relative">
            <img 
              src={profile?.photos ? JSON.parse(profile.photos)[0] : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.userId}`} 
              className="w-full h-full object-cover"
              alt={profile?.fullName}
            />
            <button 
              onClick={() => router.back()}
              className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all z-10"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            
            {isMasked && (
              <div 
                onClick={() => openUpgradeModal('unlimited_profiles', 'PRIME')}
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-3xl border border-white/30 group-hover:scale-110 transition-all">
                  <span className="material-symbols-outlined text-white text-3xl">photo_library</span>
                </div>
                <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] mt-4 shadow-sm">Upgrade to see all photos</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 -mt-12 relative bg-white rounded-t-[3rem]">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-black text-stone-900 tracking-tight">{profile?.fullName}</h1>
                <p className="text-stone-500 font-bold mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {profile?.location}
                </p>
              </div>
              <div className="px-4 py-2 bg-primary/5 rounded-2xl">
                <span className="text-primary font-black text-xs uppercase tracking-widest">Match Profile</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Religion</p>
                <p className="text-sm font-bold text-stone-800">{profile?.religion}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Caste</p>
                <p className="text-sm font-bold text-stone-800">{profile?.caste}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Education</p>
                <p className="text-sm font-bold text-stone-800">{profile?.education}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Profession</p>
                <p className="text-sm font-bold text-stone-800">{profile?.profession}</p>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-widest border-b border-stone-50 pb-3">About Me</h3>
              <p className="text-stone-600 text-sm leading-relaxed font-medium">{profile?.bio || "No bio provided."}</p>
            </div>

            {/* Contact Section Lock */}
            <div className="p-8 rounded-[2rem] bg-stone-50 border border-stone-100 text-center relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest mb-4">Contact Information</h3>
                {isMasked ? (
                  <button 
                    onClick={() => openUpgradeModal('contact_share', 'ROYAL')}
                    className="flex flex-col items-center justify-center gap-3 w-full p-6 bg-white rounded-2xl border border-dashed border-stone-200 hover:border-primary transition-all group/btn"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover/btn:scale-110 transition-all">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Upgrade to Royal to Reveal Contact</p>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-stone-800">{profile?.user?.email || 'N/A'}</p>
                    <p className="text-sm font-bold text-stone-800">{profile?.user?.phone || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
