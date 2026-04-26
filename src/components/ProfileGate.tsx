'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ProfileGateProps {
  children: React.ReactNode;
}

export default function ProfileGate({ children }: ProfileGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isIncomplete = status === 'authenticated' && 
    session?.user?.isProfileComplete === false && 
    process.env.NODE_ENV === "production";

  return (
    <div className="relative w-full">

      {/* MAIN CONTENT - Blurred when incomplete */}
      <div className={isIncomplete ? "blur-sm pointer-events-none select-none overflow-hidden" : ""}>
        {children}
      </div>

      {/* OVERLAY - Shown only when incomplete */}
      {isIncomplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-md z-50 p-6 rounded-3xl">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-stone-200/50 border border-stone-100 text-center max-w-md w-full animate-fade-in-up">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl fill-1">lock</span>
            </div>
            
            <h2 className="font-headline text-2xl font-black text-stone-900 mb-3 tracking-tight">
              Unlock the Magic ❤️
            </h2>
            <p className="text-stone-500 font-medium text-sm leading-relaxed mb-8">
              Complete your profile to view matches, search profiles, and start meaningful conversations with potential partners.
            </p>
            
            <button 
              onClick={() => router.push('/profile')}
              className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Complete Profile
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
            
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-stone-300">
              Only takes a minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
