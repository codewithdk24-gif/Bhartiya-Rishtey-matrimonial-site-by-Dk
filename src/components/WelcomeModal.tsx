'use client';

import { useRouter } from 'next/navigation';

interface WelcomeModalProps {
  isOpen: boolean;
}

export default function WelcomeModal({ isOpen }: WelcomeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden animate-scale-in">
        {/* Decorative Top Section */}
        <div className="h-32 bg-gradient-to-br from-primary to-primary-dark relative flex items-center justify-center">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pollen.png")' }} />
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl animate-heartbeat">favorite</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-8 pt-10 pb-12 text-center">
          <h2 className="font-headline text-2xl font-black text-stone-900 mb-3 leading-tight">
            Welcome to <br />
            <span className="text-primary">Bhartiya Rishtey ❤️</span>
          </h2>
          
          <p className="text-stone-500 font-medium text-sm mb-10 leading-relaxed">
            We're excited to have you here! Let's complete your profile to find the perfect matches for your journey.
          </p>

          <button
            onClick={() => router.replace('/profile/setup')}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
          >
            Complete Profile
            <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          
          <p className="text-[10px] text-stone-400 mt-6 uppercase tracking-widest font-bold">
            Takes only 2 minutes
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
