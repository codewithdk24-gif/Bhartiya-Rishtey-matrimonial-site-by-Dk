'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PLANS, getPlanById } from '@/lib/constants/plans';

function DashNav() {
  const router = useRouter();
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };
  const links = [
    { h: '/dashboard', i: 'dashboard', l: 'Dashboard' },
    { h: '/discover', i: 'local_fire_department', l: 'For You' },
    { h: '/search', i: 'search', l: 'Search' },
    { h: '/likes', i: 'favorite', l: 'Likes' },
    { h: '/chat', i: 'chat', l: 'Messages' },
    { h: '/profile', i: 'person', l: 'Profile' },
  ];
  return (
    <>
      <nav className="nav-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-2">
            <span className="font-headline text-lg font-bold text-stone-900 hidden sm:block">Bhartiya Rishtey</span>
          </Link>
          <div className="hidden md:flex items-center gap-0.5">
            {links.map(link => (
              <Link key={link.h} href={link.h} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${link.h === '/payment' ? 'text-primary bg-primary/5' : 'text-stone-500 hover:text-primary hover:bg-primary/5'}`}>
                <span className="material-symbols-outlined text-lg">{link.i}</span>{link.l}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/payment" className="p-2 rounded-xl hover:bg-gold/10 transition-colors"><span className="material-symbols-outlined text-gold">diamond</span></Link>
            <button onClick={handleLogout} className="p-2 rounded-xl text-stone-400 hover:text-error hover:bg-error/5 transition-all"><span className="material-symbols-outlined text-lg">logout</span></button>
          </div>
        </div>
      </nav>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 nav-glass border-t border-stone-200/50 z-50 px-1 py-1 flex justify-around">
        {links.map(link => (
          <Link key={link.h} href={link.h} className={`flex flex-col items-center gap-0 px-1 py-1.5 rounded-xl text-[8px] min-[360px]:text-[10px] font-medium transition-all ${link.h === '/payment' ? 'text-primary' : 'text-stone-400'}`}>
            <span className="material-symbols-outlined text-lg min-[360px]:text-xl">{link.i}</span>
            <span className="whitespace-nowrap">{link.l}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function PaymentPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payment/status')
      .then(r => r.json())
      .then(data => {
        setPaymentStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedPlan = selectedPlanId ? getPlanById(selectedPlanId) : null;

  return (
    <>
      <DashNav />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 pb-24 animate-fade-in-up">
        <div className="text-center mb-12">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-gold mb-3 block">Upgrade Your Plan</span>
          <h1 className="font-headline text-4xl font-bold text-stone-900 mb-3">
            Unlock Premium <span className="text-gradient-gold">Features</span>
          </h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            Upgrade your membership to enjoy exclusive benefits and find your perfect match faster with Bhartiya Rishtey.
          </p>
        </div>

        {/* Current Status */}
        {paymentStatus?.status && (
          <div className={`glass-card p-5 mb-8 flex items-center gap-4 ${
            paymentStatus.status === 'PENDING' ? 'border-warning/30' :
            paymentStatus.status === 'APPROVED' ? 'border-success/30' :
            'border-error/30'
          }`}>
            <span className={`material-symbols-outlined text-2xl ${
              paymentStatus.status === 'PENDING' ? 'text-warning' :
              paymentStatus.status === 'APPROVED' ? 'text-success' :
              'text-error'
            }`}>
              {paymentStatus.status === 'PENDING' ? 'hourglass_top' :
               paymentStatus.status === 'APPROVED' ? 'verified' : 'cancel'}
            </span>
            <div>
              <p className="font-semibold text-stone-900">
                {paymentStatus.status === 'PENDING' ? 'Payment verification in progress' :
                 paymentStatus.status === 'APPROVED' ? `Your ${paymentStatus.tier} plan is active!` :
                 'Payment was rejected'}
              </p>
              <p className="text-sm text-stone-500">
                {paymentStatus.status === 'PENDING' ? 'Our team will verify your payment within 10–30 minutes.' :
                 paymentStatus.status === 'REJECTED' ? paymentStatus.rejectionReason : ''}
              </p>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`glass-card p-8 relative cursor-pointer transition-all ${
                selectedPlanId === plan.id ? 'ring-2 ring-primary scale-[1.02] shadow-xl' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                  plan.id === 'ROYAL' ? 'badge-premium' : 'badge-royal'
                }`}>{plan.badge}</div>
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

              <ul className="space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-stone-600">
                    <span className="material-symbols-outlined text-sm text-success mt-0.5">check_circle</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className={`w-full text-center py-3 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${
                selectedPlanId === plan.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-stone-100 text-stone-500'
              }`}>
                {selectedPlanId === plan.id ? '✓ Selected' : 'Select Plan'}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Instructions */}
        {selectedPlan && (
          <div className="glass-card p-8 mt-8 animate-fade-in-up">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              Payment Instructions for {selectedPlan.name}
            </h2>
            <div className="bg-stone-50 rounded-xl p-5 mb-6">
              <p className="text-sm text-stone-700 leading-relaxed">
                <strong>Step 1:</strong> Make payment of <strong>{selectedPlan.price}</strong> via UPI, Bank Transfer, or any preferred method.<br /><br />
                <strong>Step 2:</strong> Take a screenshot of the payment confirmation.<br /><br />
                <strong>Step 3:</strong> Upload the screenshot below. Our team will verify and activate your <strong>{selectedPlan.months} month</strong> membership within 10–30 minutes.
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-xl p-5 mb-6">
              <p className="text-sm font-semibold text-stone-700 mb-2">UPI Payment Details (Bhartiya Rishtey):</p>
              <p className="text-sm text-stone-600 font-mono">bhartiyarishtey@upi</p>
              <p className="text-xs text-stone-400 mt-2">Or scan the QR code in our mobile app</p>
            </div>

            <p className="text-xs text-stone-400 text-center">
              Payment screenshot upload requires Cloudinary configuration. Contact @DineshKurre for assistance.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

