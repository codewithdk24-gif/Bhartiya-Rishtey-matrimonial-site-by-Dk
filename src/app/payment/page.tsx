'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashNav from '@/components/DashNav';
import { PLANS } from '@/lib/constants/plans';

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

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const selectedPlan = PLANS.find(p => p.id === selectedPlanId) || PLANS[1]; // Fallback to Prime

  const paymentRef = useRef<HTMLDivElement>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  
  const handleCopyUPI = () => {
    navigator.clipboard.writeText('bhartiyarishtey@upi');
    // Using a more subtle notification would be better, but keeping it simple for now
  };

  const handlePlanSelect = (id: string) => {
    setSelectedPlanId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('plan', id);
    router.replace(`/payment?${params.toString()}`, { scroll: false });
    
    // Auto-scroll to payment section
    if (paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr && !screenshotUrl) {
      setError('Please provide either a UTR number or a screenshot');
      return;
    }

    if (utr && utr.length !== 12) {
      setError('UTR number must be exactly 12 digits');
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
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20 ring-8 ring-emerald-50/50">
          <span className="material-symbols-outlined text-5xl font-bold">check_circle</span>
        </div>
        <h1 className="text-3xl font-black text-stone-900 mb-3 tracking-tight">Payment Received!</h1>
        <p className="text-stone-500 font-medium mb-10 leading-relaxed">
          Your request for <span className="text-rose-600 font-black">{selectedPlan.name}</span> is being processed. 
          Expect activation within <span className="text-stone-900 font-bold">2–4 hours</span>.
        </p>
        
        <div className="bg-white rounded-[2.5rem] border border-stone-100 p-8 shadow-2xl shadow-stone-200/40 mb-12 text-left space-y-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">Transaction ID</span>
            <span className="text-xs font-black text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg">{requestId}</span>
          </div>
          <div className="h-px bg-stone-50 w-full" />
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">Plan Type</span>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
               <span className="text-xs font-black text-rose-600 uppercase tracking-widest">{selectedPlan.name}</span>
            </div>
          </div>
          <div className="flex justify-between items-center relative z-10">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em]">Amount Confirmed</span>
            <span className="text-sm font-black text-stone-900">₹{selectedPlan.priceNumeric.toLocaleString()}</span>
          </div>
        </div>

        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-5 bg-stone-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-stone-900/20 hover:bg-black hover:-translate-y-1 active:scale-95 transition-all duration-300"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-8 md:pt-12 pb-40">
      {/* 1. HEADER SECTION */}
      <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-top-4 duration-700 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 border border-rose-100/50">
           <span className="material-symbols-outlined text-[14px] md:text-[16px] fill-1">verified</span>
           Official Payment Gateway
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight mb-3">Upgrade Account</h2>
        <p className="text-stone-500 text-sm md:text-lg font-medium max-w-lg mx-auto">Instant premium access and direct contact features.</p>
      </div>

      {/* 2. PLAN SELECTION - COMPACT FOR MOBILE */}
      <section className="mb-12 md:mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => handlePlanSelect(plan.id)}
              className={`group relative text-left p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 transition-all duration-500 active:scale-[0.98] ${
                selectedPlanId === plan.id 
                ? 'bg-gradient-to-br from-white to-rose-50/50 border-[#E11D48] shadow-xl md:shadow-[0_30px_60px_rgba(225,29,72,0.15)] scale-[1.02] md:scale-[1.05] ring-2 md:ring-4 ring-rose-50' 
                : 'bg-white border-stone-100 opacity-70 md:opacity-100 scale-95 md:scale-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-xl md:text-2xl font-black transition-colors ${selectedPlanId === plan.id ? 'text-[#E11D48]' : 'text-stone-900'}`}>{plan.name}</h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{plan.period}</p>
                </div>
                {selectedPlanId === plan.id && (
                  <span className="material-symbols-outlined text-[#E11D48] font-bold fill-1 animate-in zoom-in duration-500">check_circle</span>
                )}
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-stone-900 tracking-tighter">{plan.price}</span>
                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tight ml-1">One-time</span>
              </div>

              <ul className="space-y-2 mb-4">
                {(expandedPlanId === plan.id ? plan.features : plan.features.slice(0, 3)).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] md:text-sm text-stone-600 font-medium leading-tight">
                    <span className={`material-symbols-outlined text-[14px] md:text-[18px] font-bold mt-0.5 shrink-0 text-emerald-500`}>
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              
              {plan.features.length > 3 && (
                <div 
                  onClick={(e) => { e.stopPropagation(); setExpandedPlanId(expandedPlanId === plan.id ? null : plan.id); }}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:underline"
                >
                  {expandedPlanId === plan.id ? 'Show Less' : `+ ${plan.features.length - 3} More Features`}
                  <span className="material-symbols-outlined text-[12px]">{expandedPlanId === plan.id ? 'expand_less' : 'expand_more'}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* 3. UNIFIED PAYMENT CONTAINER */}
      <section ref={paymentRef} className="bg-white rounded-[2.5rem] md:rounded-[4rem] border border-stone-100 shadow-xl overflow-hidden relative group/container">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-rose-50/20 pointer-events-none" />
        
        <div className="grid lg:grid-cols-[1.2fr_1fr] relative z-10">
          
          {/* LEFT SIDE: SCAN & INFO */}
          <div className="p-8 md:p-16 lg:border-r border-stone-100">
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="flex items-center gap-3 mb-8 md:mb-12">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-stone-900 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xs md:text-base">1</div>
                <h3 className="text-[10px] md:text-xs font-black text-stone-900 uppercase tracking-[0.3em]">Scan QR Code</h3>
              </div>
              
              {/* UPI ID ABOVE QR FOR MOBILE FLOW */}
              <div className="mb-8 p-4 md:p-6 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between group/upi">
                <div className="min-w-0">
                  <p className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">UPI ID</p>
                  <p className="text-sm md:text-base font-black text-stone-900 tracking-tight truncate select-all">bhartiyarishtey@upi</p>
                </div>
                <button 
                  onClick={handleCopyUPI}
                  className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-white text-stone-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>

              <div className="relative mb-10 md:mb-14 group/qr flex flex-col items-center">
                <div className="absolute inset-0 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                {/* QR Container with Scanning Animation */}
                <div className="relative w-44 h-44 md:w-64 md:h-64 bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.12)] border border-stone-50 overflow-hidden group-hover/qr:scale-[1.02] transition-transform duration-500">
                  <img src="/images/upi-qr.png" alt="UPI QR Code" className="w-full h-full object-contain relative z-10" />
                  
                  {/* QR Corner Decorations */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-rose-200 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-rose-200 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-rose-200 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-rose-200 rounded-br-lg" />
                </div>

                {/* UPI App Logos for trust */}
                <div className="mt-8 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden p-2" title="Google Pay">
                      <img src="https://cdn.simpleicons.org/googlepay/5F6358" alt="GPay" className="w-full h-full object-contain opacity-80" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden p-2" title="PhonePe">
                      <img src="https://cdn.simpleicons.org/phonepe/5F259F" alt="PhonePe" className="w-full h-full object-contain opacity-80" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden p-2" title="Paytm">
                      <img src="https://cdn.simpleicons.org/paytm/00BAF2" alt="Paytm" className="w-full h-full object-contain opacity-80" />
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white border border-stone-100 shadow-sm flex items-center justify-center overflow-hidden p-2" title="BHIM">
                      <img src="https://cdn.simpleicons.org/bhim/000000" alt="BHIM" className="w-full h-full object-contain opacity-80" />
                    </div>
                  </div>
                  <div className="h-4 w-px bg-stone-200" />
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse" />
                    Works with all UPI Apps
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8">
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 flex items-center justify-between">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{selectedPlan.name} Plan</p>
                  <p className="text-xl font-black text-[#E11D48]">₹{selectedPlan.priceNumeric.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-6 px-2">
                  <div className="flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-emerald-500 text-sm font-bold">verified_user</span>
                     <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Secure 🔒</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-amber-500 text-sm font-bold">bolt</span>
                     <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Instant Activation ⚡</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SUBMISSION FORM */}
          <div className="p-8 md:p-16 flex flex-col justify-center bg-stone-50/30">
            <div className="max-w-md mx-auto w-full">
              <div className="flex items-center gap-3 mb-8 md:mb-12">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center font-black shadow-lg shadow-rose-200 text-xs md:text-base">2</div>
                <h3 className="text-[10px] md:text-xs font-black text-stone-900 uppercase tracking-[0.3em]">Confirm Details</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                  <input 
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value.toUpperCase())}
                    placeholder="Enter 12-digit UTR number"
                    className="w-full bg-white border-2 border-stone-100 focus:border-rose-200 rounded-2xl px-6 py-4 md:py-6 text-sm font-black text-stone-900 placeholder:text-stone-200 transition-all outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Payment Screenshot</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setScreenshotUrl('https://placehold.co/600x400?text=Screenshot+Uploaded');
                    }}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  <label 
                    htmlFor="screenshot-upload"
                    className={`w-full flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                      screenshotUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-stone-100 text-stone-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{screenshotUrl ? 'image' : 'cloud_upload'}</span>
                    <p className="text-[10px] font-black uppercase tracking-widest">{screenshotUrl ? 'Screenshot Attached' : 'Upload Screenshot'}</p>
                  </label>
                </div>

                {error && (
                  <div className="p-4 bg-rose-50 text-[#E11D48] rounded-xl text-[10px] font-black flex items-start gap-3 border border-rose-100/50">
                    <span className="material-symbols-outlined text-lg">error_outline</span>
                    <p>{error}</p>
                  </div>
                )}

                <div className="pt-4 pb-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 md:h-20 bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Complete Payment →"
                    )}
                  </button>
                </div>
              </form>
            </div>
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
