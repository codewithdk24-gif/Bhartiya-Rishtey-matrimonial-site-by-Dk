'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PLANS } from '@/lib/constants/plans';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: string;
}

export default function UpgradeModal({ isOpen, onClose, feature, requiredPlan }: UpgradeModalProps) {
  // ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;
  if (!PLANS || PLANS.length === 0) return null;

  const getFeatureText = (f: string) => {
    switch (f) {
      case 'unlimited_interests': return 'Send unlimited interests to your matches';
      case 'unlimited_messages': return 'Continue chatting without any limits';
      case 'contact_share': return 'Share your phone/email directly with matches';
      case 'profile_views': return 'See who is visiting your profile';
      case 'unlimited_profiles': return 'Unlock and view all available profiles';
      case 'premium_access': return 'Unlock premium features and find your match 3x faster';
      default: return 'Unlock this premium feature and more';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative bg-gradient-to-br from-rose-50 to-white w-full max-w-xl rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-white">
        
        {/* Top Glow Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#E11D48]/10 blur-3xl -mt-16 pointer-events-none" />

        <div className="p-8 md:p-12 relative z-10">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md flex items-center justify-center text-stone-400 hover:text-stone-900 hover:rotate-90 hover:scale-110 transition-all duration-300 shadow-sm border border-stone-100/50 active:scale-90"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white shadow-2xl shadow-rose-200/50 text-[#E11D48] mb-8 animate-bounce-subtle">
              <span className="material-symbols-outlined text-4xl fill-1">workspace_premium</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tight mb-3">Upgrade to Premium</h2>
            <p className="text-stone-500 text-sm font-medium px-8 leading-relaxed italic">"{getFeatureText(feature)}"</p>
          </div>

          <div className="space-y-5 mb-10">
            {PLANS.map((plan) => (
              <Link
                key={plan.id}
                href={`/payment?plan=${plan.id}`}
                onClick={onClose}
                className={`group relative flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 ${
                  plan.id === 'PRIME' 
                    ? 'border-[#E11D48] bg-white shadow-2xl shadow-rose-200/40 scale-[1.02]' 
                    : 'border-stone-100 bg-white/60 hover:bg-white hover:border-rose-100 hover:shadow-xl'
                }`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-8 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${
                    plan.id === 'PRIME' ? 'bg-[#E11D48] text-white animate-pulse' : 'bg-stone-900 text-white'
                  }`}>
                    {plan.id === 'PRIME' ? 'Most Popular' : plan.badge}
                  </span>
                )}
                
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${plan.id === 'PRIME' ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-400 group-hover:bg-rose-50 group-hover:text-rose-500'}`}>
                      <span className="material-symbols-outlined text-2xl font-bold">
                        {plan.id === 'BASIC' ? 'verified' : plan.id === 'PRIME' ? 'rocket_launch' : 'diamond'}
                      </span>
                   </div>
                   <div>
                      <h3 className="text-lg font-black text-stone-900 leading-none mb-1">{plan.name}</h3>
                      <p className="text-xs text-stone-400 font-black uppercase tracking-widest">{plan.period}</p>
                   </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-black text-stone-900">{plan.price}</div>
                  <div className="flex items-center justify-end gap-1 text-xs font-black text-emerald-500 uppercase tracking-widest">
                     <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
                     Secure
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-2">
            <Link 
              href="/premium"
              onClick={onClose}
              className="group block w-full py-5 bg-stone-900 text-white rounded-2xl text-[11px] font-black text-center shadow-2xl shadow-stone-900/20 hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              View All Features & Compare
            </Link>
            
            <p className="mt-8 flex items-center justify-center gap-6 text-xs font-black text-stone-300 uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">lock</span> Safe & Secure</span>
               <span className="w-1 h-1 bg-stone-200 rounded-full" />
               <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">bolt</span> Instant Access</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
