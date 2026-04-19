/**
 * NEW: Admin Payment Review Page
 * Original was a stub with no implementation.
 * Admins can approve/reject payment receipts here.
 */

'use client';

import { useEffect, useState } from 'react';

interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  tier: string;
  screenshotUrl: string;
  status: string;
  createdAt: string;
  user?: { email: string; profile?: { fullName: string } };
}

export default function AdminPaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  useEffect(() => {
    fetch(`/api/admin/payments?status=${filter}`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setLoading(false); })
      .catch(console.error);
  }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    await fetch('/api/admin/payments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, rejectionReason: reason }),
    });
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-extrabold text-stone-900">Payment Verification</h1>

      <div className="flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${
              filter === s
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-100 text-stone-400">
          No {filter.toLowerCase()} payment requests.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-6 border border-stone-200 flex gap-6 items-start">
              <img
                src={req.screenshotUrl}
                alt="Receipt"
                className="w-24 h-24 object-cover rounded-xl border border-stone-200 cursor-pointer"
                onClick={() => window.open(req.screenshotUrl, '_blank')}
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-stone-900">{req.user?.profile?.fullName ?? 'Unknown'}</p>
                    <p className="text-sm text-stone-500">{req.user?.email}</p>
                    <p className="text-sm font-medium mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${req.tier === 'ROYAL' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                        {req.tier}
                      </span>
                      {' '}·{' '}
                      <span className="text-stone-700">₹{req.amount.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(req.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Rejection reason (shown to user):');
                          if (reason !== null) handleAction(req.id, 'reject', reason);
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
