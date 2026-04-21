'use client';

import React from 'react';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: string;
}

const PLANS = [
  {
    name: 'PRIME',
    price: '₹1,100',
    duration: '3 Months',
    recommended: true,
    features: ['Unlimited Interests', 'Unlimited Messages', 'See Profile Views']
  },
  {
    name: 'ROYAL',
    price: '₹2,500',
    duration: '6 Months',
    recommended: false,
    features: ['Everything in Prime', 'Share Contact Details', 'Invisible Mode']
  }
];

export default function UpgradeModal({ isOpen, onClose, feature, requiredPlan }: UpgradeModalProps) {
  if (!isOpen) return null;

  const getFeatureText = (f: string) => {
    switch (f) {
      case 'unlimited_interests': return 'Send unlimited interests to your matches';
      case 'unlimited_messages': return 'Continue chatting without any limits';
      case 'contact_share': return 'Share your phone/email directly with matches';
      case 'profile_views': return 'See who is visiting your profile';
      case 'unlimited_profiles': return 'Unlock and view all available profiles';
      default: return 'Unlock this premium feature and more';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 md:p-10">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-6">
              <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            </div>
            <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Unlock Premium</h2>
            <p className="text-stone-500 font-medium">{getFeatureText(feature)}</p>
          </div>

          <div className="space-y-4 mb-8">
            {PLANS.map((plan) => (
              <div 
                key={plan.name}
                className={`relative p-6 rounded-3xl border-2 transition-all ${
                  plan.recommended 
                    ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
                    : 'border-stone-100 hover:border-stone-200'
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                    Recommended
                  </span>
                )}
                
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-black text-stone-900">{plan.name}</h3>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{plan.duration}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-stone-900">{plan.price}</div>
                    <p className="text-[10px] text-stone-400 font-medium">Safe & Secure</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-stone-600 border border-stone-100 uppercase tracking-tight">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Link 
              href="/payment" 
              className="block w-full py-4 bg-stone-900 text-white rounded-2xl text-sm font-black text-center shadow-xl shadow-stone-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              Upgrade to PRIME — ₹1,100
            </Link>
            
            <Link 
              href="/premium"
              onClick={onClose}
              className="block w-full py-2 text-stone-400 hover:text-stone-900 text-xs font-black text-center transition-all uppercase tracking-widest"
            >
              View all plans & features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
