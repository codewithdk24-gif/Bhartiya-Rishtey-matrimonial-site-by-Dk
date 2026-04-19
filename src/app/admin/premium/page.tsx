'use client';

import { useEffect, useState } from 'react';

interface PremiumUser {
  id: string;
  tier: string;
  status: string;
  expiresAt: string;
  user: {
    id: string;
    shortId: string;
    email: string;
    phone: string | null;
    createdAt: string;
    profile?: {
      fullName: string;
    }
  }
}

export default function PremiumUsersPage() {
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPremiumUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/premium?q=${search}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPremiumUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPremiumUsers();
  }, [search]); // Auto fetch on search typing for smooth feeling

  const calculateDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    if (days < 0) return 'Expired';
    return `${days} days left`;
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-headline text-3xl font-bold text-stone-900 flex items-center gap-3">
            Premium Members <span className="material-symbols-outlined text-gold">workspace_premium</span>
          </h1>
          <p className="text-stone-500">View and manage users with active subscriptions.</p>
        </div>
        
        <div className="w-72">
          <input
            type="text"
            placeholder="Filter premium members..."
            className="input-field w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading && premiumUsers.length === 0 ? (
          <div className="p-12 text-center text-stone-500">Loading premium members...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 text-sm">
                  <th className="p-4 font-semibold uppercase tracking-wider">Member</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Contact</th>
                  <th className="p-4 font-semibold uppercase tracking-wider">Subscription Tier</th>
                  <th className="p-4 font-semibold uppercase tracking-wider text-right">Expiration Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {premiumUsers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gold/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                          {sub.user.profile?.fullName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{sub.user.profile?.fullName || 'No Profile'}</p>
                          <p className="text-xs font-medium text-stone-500 flex items-center gap-1">
                            ID: <span className="bg-stone-200 text-stone-700 px-1.5 rounded">{sub.user.shortId || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-stone-800">{sub.user.email}</p>
                      <p className="text-xs text-stone-500">{sub.user.phone || 'No Phone'}</p>
                    </td>
                    <td className="p-4">
                       <span className="text-xs font-bold text-gold border border-gold/30 bg-gold/10 px-3 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
                         <span className="material-symbols-outlined text-[14px]">star</span>
                         {sub.tier}
                       </span>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-stone-900">{new Date(sub.expiresAt).toLocaleDateString()}</p>
                      <p className={`text-xs font-semibold mt-1 ${calculateDaysLeft(sub.expiresAt) === 'Expired' ? 'text-error' : 'text-success'}`}>
                         {calculateDaysLeft(sub.expiresAt)}
                      </p>
                    </td>
                  </tr>
                ))}
                {premiumUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-stone-500">No active premium members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
