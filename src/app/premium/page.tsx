'use client';

import React from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';

const PREMIUM_PLANS = [
  {
    id: 'PRIME',
    name: 'Prime Membership',
    price: '₹1,100',
    originalPrice: '₹1,500',
    duration: '3 Months',
    recommended: true,
    tagline: 'Best for serious seekers',
    features: [
      { text: 'Send Unlimited Interests', included: true },
      { text: 'Unlimited Direct Messaging', included: true },
      { text: 'See Who Viewed Your Profile', included: true },
      { text: 'Advanced Search Filters', included: true },
      { text: 'Share Contact Details', included: false },
      { text: 'Invisible Mode', included: false },
    ]
  },
  {
    id: 'ROYAL',
    name: 'Royal Membership',
    price: '₹2,500',
    originalPrice: '₹3,500',
    duration: '6 Months',
    recommended: false,
    tagline: 'Maximum privacy & access',
    features: [
      { text: 'Send Unlimited Interests', included: true },
      { text: 'Unlimited Direct Messaging', included: true },
      { text: 'See Who Viewed Your Profile', included: true },
      { text: 'Advanced Search Filters', included: true },
      { text: 'Share Contact Details', included: true },
      { text: 'Invisible Mode', included: true },
    ]
  },
  {
    id: 'LEGACY',
    name: 'Legacy Membership',
    price: '₹4,900',
    originalPrice: '₹7,500',
    duration: '12 Months',
    recommended: false,
    tagline: 'One year of premium matching',
    features: [
      { text: 'Everything in Royal', included: true },
      { text: 'Personalized Matchmaker', included: true },
      { text: 'Profile Highlighting', included: true },
      { text: 'Priority Customer Support', included: true },
      { text: 'Share Contact Details', included: true },
      { text: 'Invisible Mode', included: true },
    ]
  }
];

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-6 animate-fade-in">
            <span className="material-symbols-outlined text-sm">stars</span>
            Premium Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-stone-900 tracking-tight mb-6">
            Find Your Forever <span className="text-primary italic">Faster.</span>
          </h1>
          <p className="text-stone-500 font-medium text-lg leading-relaxed">
            Upgrade to a premium membership to unlock unlimited interactions and exclusive privacy features designed for serious matches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {PREMIUM_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative group bg-white rounded-[2.5rem] p-8 md:p-10 border transition-all duration-500 ${
                plan.recommended 
                  ? 'border-primary shadow-2xl shadow-primary/10 scale-105 z-10' 
                  : 'border-stone-100 hover:border-stone-200 hover:shadow-xl shadow-stone-200/50'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-primary/20">
                  Most Popular
                </div>
              )}

              <div className="mb-10 text-center">
                <h3 className="text-sm font-black text-stone-400 uppercase tracking-[0.2em] mb-4">{plan.name}</h3>
                <div className="flex items-end justify-center gap-2 mb-2">
                  <span className="text-stone-300 text-lg font-bold line-through mb-1">{plan.originalPrice}</span>
                  <span className="text-4xl font-black text-stone-900">{plan.price}</span>
                </div>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest bg-stone-50 inline-block px-4 py-1.5 rounded-full">
                  Valid for {plan.duration}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className={`material-symbols-outlined text-lg ${feature.included ? 'text-primary' : 'text-stone-200'}`}>
                      {feature.included ? 'check_circle' : 'do_not_disturb_on'}
                    </span>
                    <span className={`text-sm font-medium ${feature.included ? 'text-stone-700' : 'text-stone-300 line-through'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <Link 
                href={`/payment?plan=${plan.id}`}
                className={`block w-full py-5 rounded-2xl text-xs font-black text-center transition-all uppercase tracking-[0.2em] shadow-lg ${
                  plan.recommended 
                    ? 'bg-stone-900 text-white shadow-stone-900/20 hover:bg-stone-800' 
                    : 'bg-white border-2 border-stone-100 text-stone-900 hover:border-stone-900'
                }`}
              >
                Choose {plan.id}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-4">Trusted by thousands of successful couples</p>
          <div className="flex flex-wrap justify-center gap-10 grayscale opacity-40">
            {/* Minimalist Trust Badges */}
            <div className="text-xl font-black tracking-tighter">SECURE PAYMENT</div>
            <div className="text-xl font-black tracking-tighter">VERIFIED PROFILES</div>
            <div className="text-xl font-black tracking-tighter">24/7 SUPPORT</div>
          </div>
        </div>
      </main>
    </div>
  );
}
