'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF1ED] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[150px] font-black text-rose-500/10 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl flex items-center justify-center transform -rotate-12 border border-rose-50">
                <span className="material-symbols-outlined text-5xl md:text-6xl text-rose-500 fill-1">heart_broken</span>
             </div>
          </div>
        </div>

        <h1 className="font-headline text-3xl md:text-4xl font-black text-stone-900 mb-4 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-stone-500 font-medium mb-10 leading-relaxed">
          The page you're looking for has moved to another galaxy, or it never existed in the first place. Let's get you back to your match! ❤️
        </p>

        <div className="space-y-3">
          <Link 
            href="/dashboard"
            className="w-full h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">home</span>
            Back to Dashboard
          </Link>
          <button 
            onClick={() => router.back()}
            className="w-full h-14 bg-white text-stone-600 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest border border-stone-100 hover:bg-stone-50 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Go Back
          </button>
        </div>

        <div className="mt-12 flex items-center justify-center gap-6">
           <Link href="/discover" className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Discover</Link>
           <span className="w-1 h-1 bg-stone-200 rounded-full" />
           <Link href="/matches" className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Matches</Link>
           <span className="w-1 h-1 bg-stone-200 rounded-full" />
           <Link href="/premium" className="text-[10px] font-black text-stone-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Premium</Link>
        </div>
      </div>
    </div>
  );
}
