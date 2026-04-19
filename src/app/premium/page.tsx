'use client';

import Link from 'next/link';
import { PLANS } from '@/lib/constants/plans';

export default function PremiumPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-headline font-bold text-lg shadow-md">B</div>
            <div>
              <h1 className="font-headline text-xl font-bold text-stone-900">Bhartiya Rishtey</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Premium Matrimony</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary text-xs px-5 py-2.5">Log In</Link>
            <Link href="/signup" className="btn-primary text-xs px-5 py-2.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl float-animation" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl float-animation-delay" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 animate-fade-in-up">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gold mb-4 block">Premium Membership</span>
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-stone-900 mb-6">
            Find Love <span className="text-gradient">Without Limits</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            Unlock the full potential of Bhartiya Rishtey with our premium plans. Access unlimited matches, priority search visibility, and dedicated support.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`glass-card p-8 relative ${i === 1 ? 'ring-2 ring-primary/30 scale-[1.03]' : ''} ${
                plan.id === 'LEGACY' ? 'ring-2 ring-gold/20' : ''
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                  plan.id === 'ROYAL' ? 'badge-premium' : 'badge-royal'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <span className={`material-symbols-outlined text-5xl mb-3 block ${
                  plan.id === 'PRIME' ? 'text-stone-400' :
                  plan.id === 'ROYAL' ? 'text-primary' : 'text-gold'
                }`}>
                  {plan.id === 'PRIME' ? 'person' : plan.id === 'ROYAL' ? 'workspace_premium' : 'diamond'}
                </span>
                <h3 className="font-headline text-2xl font-bold text-stone-900 mb-1">{plan.name}</h3>
                <p className="font-headline text-4xl font-bold text-stone-900">{plan.price}</p>
                <p className="text-sm text-stone-400">{plan.period}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-stone-600">
                    <span className="material-symbols-outlined text-sm text-success mt-0.5">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/payment" className={`${plan.style} w-full text-center block py-3`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-headline text-3xl font-bold text-stone-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I upgrade or downgrade my plan?', a: 'Yes, you can upgrade at any time. Your remaining balance will be adjusted.' },
              { q: 'Is my payment secure?', a: 'Absolutely. All payments are processed through secure channels with manual verification.' },
              { q: 'What happens when my plan expires?', a: 'You\'ll revert to the Free plan. Your data and matches are preserved.' },
              { q: 'Can I get a refund?', a: 'We offer a 7-day money-back guarantee if you\'re not satisfied.' },
            ].map((faq, i) => (
              <div key={i} className="glass-card p-5">
                <h3 className="font-semibold text-stone-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-stone-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 text-center">
        <p className="text-sm">© 2026 Bhartiya Rishtey. All rights reserved. Made with <span className="text-primary">❤</span> in India</p>
      </footer>
    </div>
  );
}
