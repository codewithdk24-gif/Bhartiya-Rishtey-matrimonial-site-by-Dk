'use client';

import { useState, useEffect } from 'react';
import DashNav from '@/components/DashNav';
import { useRouter } from 'next/navigation';

interface PaymentRequest {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  utr: string | null;
  screenshotUrl: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Screenshot Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payment/request?status=${activeTab}`);
      if (res.status === 401 || res.status === 403) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests);
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Fetch admin requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this payment and activate the plan?')) return;
    
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/admin/payment/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'APPROVE' })
      });

      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error('Approve error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId || !rejectionReason.trim()) return;

    setProcessingId(selectedRequestId);
    try {
      const res = await fetch('/api/admin/payment/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequestId, 
          action: 'REJECT',
          reason: rejectionReason 
        })
      });

      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== selectedRequestId));
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequestId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject');
      }
    } catch (err) {
      console.error('Reject error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin && !loading) return null;

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight">Payment Moderation</h1>
            <p className="text-sm text-stone-500 font-medium mt-2">Review and verify manual UPI payment requests.</p>
          </div>
          <div className="bg-white rounded-2xl p-1 shadow-sm border border-stone-100 flex gap-1">
            {['PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20' 
                    : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Plan / Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">UTR / Proof</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Submitted</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-8"><div className="h-12 bg-stone-50 rounded-2xl w-full" /></td>
                    </tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <span className="material-symbols-outlined text-6xl mb-4">payments</span>
                        <p className="text-sm font-black uppercase tracking-widest">No {activeTab.toLowerCase()} requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-stone-900 text-sm tracking-tight">{req.user.name}</p>
                          <p className="text-[11px] text-stone-400 font-medium">{req.user.email}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-primary uppercase tracking-widest">{req.plan}</span>
                          <span className="text-xs font-bold text-stone-900">₹{req.amount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200">
                            <code className="text-[10px] font-black text-stone-600 tracking-tight">{req.utr || 'NO UTR'}</code>
                          </div>
                          {req.screenshotUrl && (
                            <button 
                              onClick={() => setPreviewUrl(req.screenshotUrl)}
                              className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-all active:scale-90"
                            >
                              <span className="material-symbols-outlined text-lg">image</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[9px] text-stone-400 mt-0.5">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        {activeTab === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprove(req.id)}
                              disabled={processingId === req.id}
                              className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedRequestId(req.id);
                                setShowRejectModal(true);
                              }}
                              disabled={processingId === req.id}
                              className="px-4 py-2 bg-white text-rose-500 border border-rose-100 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                              req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {req.status}
                            </span>
                            {req.rejectionReason && (
                              <p className="text-[10px] text-stone-400 italic font-medium max-w-[150px] truncate" title={req.rejectionReason}>
                                : {req.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-black text-stone-900 mb-2">Reject Payment</h3>
            <p className="text-sm text-stone-500 font-medium mb-8">Please provide a reason for rejecting this request. This will be shown to the user.</p>
            
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. UTR mismatch, Screenshot unclear..."
              className="w-full bg-stone-50 border-none rounded-2xl px-6 py-5 text-sm font-bold text-stone-900 placeholder:text-stone-300 focus:ring-2 focus:ring-rose-500/20 transition-all outline-none resize-none mb-8 h-32"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequestId(null);
                }}
                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId !== null}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-stone-900/90 backdrop-blur-md animate-fade-in cursor-zoom-out"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <img 
              src={previewUrl} 
              alt="Payment Proof" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-scale-in" 
            />
            <button className="absolute top-0 right-0 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
