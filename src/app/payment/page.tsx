'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashNav from '@/components/DashNav';
import Link from 'next/link';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialPlanId = searchParams.get('plan') || 'PRIME';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const PLANS_INFO: Record<string, { name: string; price: number; duration: string; tag: string; features: string[] }> = {
    BASIC: { 
      name: 'Basic', 
      price: 499, 
      duration: '30 Days', 
      tag: 'Starter',
      features: ['Unlimited Interests', 'View Contact Details (10)', 'Basic Support']
    },
    PRIME: { 
      name: 'Prime', 
      price: 1100, 
      duration: '90 Days', 
      tag: 'Most Popular',
      features: ['Priority Profile', 'View Contact Details (50)', 'Dedicated Matchmaker']
    },
    ELITE: { 
      name: 'Elite', 
      price: 1999, 
      duration: '180 Days', 
      tag: 'Best Value',
      features: ['Personalized Scouting', 'Unlimited Contacts', '24/7 Priority Support']
    },
  };

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const selectedPlan = PLANS_INFO[selectedPlanId as keyof typeof PLANS_INFO] || PLANS_INFO.PRIME;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText('bhartiyarishtey@upi');
    alert('UPI ID copied to clipboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr && !screenshotUrl) {
      setError('Please provide either a UTR number or a screenshot');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/payment/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          utr,
          screenshotUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setSuccess(true);
      setRequestId(data.requestId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
          <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
        </div>
        <h1 className="text-3xl font-black text-stone-900 mb-2">Payment Submitted</h1>
        <p className="text-stone-500 font-medium mb-8">Your request is under review. Please wait 2–4 hours for activation.</p>
        
        <div className="bg-white rounded-3xl border border-stone-100 p-6 shadow-lg shadow-stone-200/50 mb-10 text-left space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Request ID</span>
            <span className="text-xs font-bold text-stone-600">{requestId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Selected Plan</span>
            <span className="text-xs font-black text-rose-600 uppercase tracking-widest">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Amount Paid</span>
            <span className="text-xs font-black text-stone-900">₹{selectedPlan.price.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-4 bg-stone-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-stone-900/20 active:scale-95 transition-all"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* 1. PLAN SELECTION */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-stone-900 tracking-tight mb-2">Choose Your Plan</h2>
          <p className="text-stone-500 text-sm font-medium">Select the membership that fits your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(PLANS_INFO).map(([id, plan]) => (
            <button
              key={id}
              onClick={() => setSelectedPlanId(id)}
              className={`relative text-left p-8 rounded-[2.5rem] border-2 transition-all duration-500 active:scale-[0.98] ${
                selectedPlanId === id 
                ? 'bg-gradient-to-br from-white to-rose-50/30 border-[#E11D48] shadow-[0_20px_50px_rgba(225,29,72,0.15)] scale-[1.02] ring-4 ring-rose-50/50' 
                : 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-lg'
              }`}
            >
              {plan.tag && (
                <span className={`absolute -top-3 left-8 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest z-10 ${
                  selectedPlanId === id ? 'bg-[#E11D48] text-white shadow-lg' : 'bg-stone-900 text-white'
                }`}>
                  {plan.tag}
                </span>
              )}

              {selectedPlanId === id && (
                <div className="absolute top-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-[#E11D48] rounded-full animate-in fade-in zoom-in duration-500">
                   <span className="text-[9px] font-black uppercase tracking-widest">Selected</span>
                   <span className="material-symbols-outlined text-[14px] font-bold fill-1">check_circle</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-black transition-colors ${selectedPlanId === id ? 'text-[#E11D48]' : 'text-stone-900'}`}>{plan.name}</h3>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">{plan.duration}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-3xl font-black text-stone-900">₹{plan.price}</span>
                <span className="text-[10px] text-stone-400 font-bold uppercase">One-time payment</span>
              </div>

              <ul className="space-y-3 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-stone-600 font-medium">
                    <span className={`material-symbols-outlined text-sm font-bold ${selectedPlanId === id ? 'text-emerald-500' : 'text-stone-300'}`}>
                      {selectedPlanId === id ? 'check_circle' : 'circle'}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </section>

      {/* 2. UNIFIED PAYMENT CONTAINER */}
      <section className="bg-white rounded-[3rem] border border-stone-100 shadow-[0_30px_100px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="grid md:grid-cols-2">
          
          {/* LEFT SIDE: SCAN & INFO */}
          <div className="p-8 md:p-12 bg-stone-50/50 border-b md:border-b-0 md:border-r border-stone-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-40" />
            
            <div className="relative">
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.25em] mb-10 text-center md:text-left">1. Scan & Pay</h3>
              
              <div className="relative w-56 h-56 mx-auto mb-10 bg-white rounded-[2.5rem] p-5 shadow-2xl shadow-stone-200/50 border border-stone-50 group">
                <img src="/images/upi-qr.png" alt="UPI QR Code" className="w-full h-full object-contain" />
                <div className="absolute -bottom-3 -right-3 bg-[#E11D48] text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white rotate-12 group-hover:rotate-0 transition-transform duration-500">
                   <span className="material-symbols-outlined text-xl font-bold">qr_code_scanner</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-stone-100 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest leading-none mb-1.5">Amount to pay</p>
                    <p className="text-2xl font-black text-stone-900 tracking-tighter">₹{selectedPlan.price.toLocaleString()}</p>
                  </div>
                  <div className="px-4 py-2 bg-rose-50 text-[#E11D48] rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100/50">
                    {selectedPlan.name}
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-5 border border-stone-100 flex items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest leading-none mb-1.5">UPI ID</p>
                    <p className="text-sm font-black text-stone-900 tracking-tight">bhartiyarishtey@upi</p>
                  </div>
                  <button 
                    onClick={handleCopyUPI}
                    className="w-11 h-11 bg-stone-50 text-stone-400 hover:text-[#E11D48] hover:bg-rose-50 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  >
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                  </button>
                </div>
              </div>

              <div className="mt-10 p-6 bg-white/50 rounded-2xl border border-stone-100/50">
                <h4 className="text-[10px] font-black text-stone-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <span className="material-symbols-outlined text-sm text-rose-500">tips_and_updates</span>
                   Quick Tip
                </h4>
                <p className="text-[11px] text-stone-500 font-medium leading-relaxed italic">
                  "Take a screenshot of the payment confirmation page in your UPI app. It helps in faster verification!"
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SUBMISSION FORM */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black text-stone-900 uppercase tracking-[0.25em]">2. Confirm Transaction</h3>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100/50">
                 <span className="material-symbols-outlined text-[12px] fill-1">verified_user</span>
                 Secure
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                <input 
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.toUpperCase())}
                  placeholder="Enter 12-digit UTR number"
                  className="w-full bg-stone-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl px-6 py-5 text-sm font-bold text-stone-900 placeholder:text-stone-300 transition-all outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Payment Screenshot (Optional)</label>
                <div className="relative group/upload">
                  <input 
                    type="text"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="Enter hosted image URL"
                    className="w-full bg-stone-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-2xl px-6 py-5 text-sm font-bold text-stone-900 placeholder:text-stone-300 transition-all outline-none"
                  />
                  <div className="flex items-center gap-2 mt-3 ml-1 text-stone-400">
                    <span className="material-symbols-outlined text-sm">cloud_upload</span>
                    <p className="text-[10px] font-medium italic">Instant activation after automated UTR check</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-5 bg-rose-50 text-[#E11D48] rounded-2xl text-[11px] font-bold flex items-start gap-4 animate-shake border border-rose-100/50">
                  <span className="material-symbols-outlined text-lg">error_outline</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-[#E11D48] text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-200 hover:bg-[#BE123C] hover:-translate-y-1 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl font-bold">check_circle</span>
                        Confirm Payment
                      </div>
                      <span className="text-[9px] font-black text-white/50 tracking-widest">Payable: ₹{selectedPlan.price.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-stone-400 text-center font-bold leading-relaxed px-6">
                Your account will be activated within <span className="text-stone-900">2–4 hours</span> of verification.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <DashNav />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div className="shimmer h-48 rounded-[2.5rem]" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="shimmer h-80 rounded-[2rem]" />
            <div className="shimmer h-80 rounded-[2rem]" />
          </div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
