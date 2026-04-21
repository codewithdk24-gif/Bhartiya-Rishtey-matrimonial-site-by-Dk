'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashNav from '@/components/DashNav';
import Link from 'next/link';

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') || 'PRIME';
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  const [utr, setUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState(''); // Placeholder for upload logic

  const PLANS_INFO: Record<string, { name: string; price: number; duration: string }> = {
    PRIME: { name: 'Prime', price: 1100, duration: '90 Days' },
    ROYAL: { name: 'Royal', price: 2500, duration: '180 Days' },
    LEGACY: { name: 'Legacy', price: 4900, duration: '365 Days' },
  };

  const selectedPlan = PLANS_INFO[planId as keyof typeof PLANS_INFO] || PLANS_INFO.PRIME;

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
          planId,
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
            <span className="text-xs font-black text-primary uppercase tracking-widest">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Status</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-lg">Pending Review</span>
          </div>
        </div>

        <button 
          onClick={() => router.push('/dashboard')}
          className="btn-primary w-full py-4 shadow-xl shadow-primary/20"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      {/* Plan Header */}
      <div className="bg-stone-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl shadow-stone-900/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-all duration-700" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Selected Membership</p>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight">{selectedPlan.name}</h1>
              <p className="text-sm font-bold text-primary mt-1">{selectedPlan.duration}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black tracking-tighter">₹{selectedPlan.price.toLocaleString()}</p>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Inclusive of GST</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Payment Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-xl shadow-stone-200/50 text-center">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-6">Scan to Pay</h3>
            <div className="relative w-48 h-48 mx-auto mb-6 bg-stone-50 rounded-2xl p-2 border border-stone-100">
              <img src="/images/upi-qr.png" alt="UPI QR Code" className="w-full h-full object-contain" />
            </div>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest leading-none mb-1">UPI ID</p>
                <p className="text-sm font-black text-stone-900 tracking-tight">bhartiyarishtey@upi</p>
              </div>
              <button 
                onClick={handleCopyUPI}
                className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm active:scale-90"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-xl shadow-stone-200/50">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">info</span>
              Instructions
            </h3>
            <ul className="space-y-4">
              {[
                'Open any UPI app (GPay, PhonePe, Paytm)',
                'Scan the QR or enter the UPI ID manually',
                `Pay the exact amount of ₹${selectedPlan.price.toLocaleString()}`,
                'Note down the UTR / Transaction ID after payment'
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stone-50 text-[10px] font-black text-stone-400 flex items-center justify-center border border-stone-100">
                    {i + 1}
                  </span>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed">{step}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Submission Form */}
        <div className="bg-white rounded-[2rem] p-8 border border-stone-100 shadow-xl shadow-stone-200/50">
          <h3 className="text-xs font-black text-stone-900 uppercase tracking-[0.2em] mb-8">Submit Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
              <input 
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value.toUpperCase())}
                placeholder="12-digit number (e.g. 3056...)"
                className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 placeholder:text-stone-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Payment Screenshot (Optional)</label>
              <div className="relative group/upload">
                <input 
                  type="text"
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 placeholder:text-stone-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
                <p className="text-[9px] text-stone-400 mt-2 ml-1 font-medium italic">Upload logic can be integrated with Cloudinary/S3</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold flex items-start gap-3 animate-shake">
                <span className="material-symbols-outlined text-lg mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-5 shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg font-bold">verified</span>
                  I Have Paid
                </>
              )}
            </button>

            <p className="text-[9px] text-stone-400 text-center font-medium leading-relaxed">
              By clicking "I Have Paid", you confirm that you have made the transaction. False claims may result in account suspension.
            </p>
          </form>
        </div>
      </div>
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
