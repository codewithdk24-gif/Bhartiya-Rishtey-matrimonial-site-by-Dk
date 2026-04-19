'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  pendingPayments: number;
  totalMatches: number;
  recentSignups: Array<{
    id: string;
    shortId: string;
    email: string;
    createdAt: string;
    profile?: { fullName: string };
  }>;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-stone-900">Dashboard Overview</h1>
        <p className="text-stone-500">Welcome to your matrimonial platform control center.</p>
      </div>

      {loading ? (
        <div className="flex space-x-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="flex-1 h-32 bg-stone-200 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 border-l-4 border-l-primary flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-500">Total Users</p>
                <span className="material-symbols-outlined text-primary/80">group</span>
              </div>
              <p className="font-headline text-3xl font-bold text-stone-900">{stats?.totalUsers || 0}</p>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-gold flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-500">Premium Members</p>
                <span className="material-symbols-outlined text-gold/80">workspace_premium</span>
              </div>
              <p className="font-headline text-3xl font-bold text-stone-900">{stats?.premiumUsers || 0}</p>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-accent flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-500">Pending Payments</p>
                <span className="material-symbols-outlined text-accent/80">pending_actions</span>
              </div>
              <p className="font-headline text-3xl font-bold text-stone-900">{stats?.pendingPayments || 0}</p>
            </div>

            <div className="glass-card p-6 border-l-4 border-l-success flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-500">Total Matches</p>
                <span className="material-symbols-outlined text-success/80">favorite</span>
              </div>
              <p className="font-headline text-3xl font-bold text-stone-900">{stats?.totalMatches || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Signups */}
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline text-xl font-bold text-stone-900">Recent Signups</h2>
                <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {stats?.recentSignups.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.profile?.fullName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-900">{user.profile?.fullName || 'No Profile'}</p>
                        <p className="text-xs text-stone-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-stone-200 text-stone-700 font-bold px-2 py-1 rounded text-xs tracking-wider">
                        {user.shortId || 'N/A'}
                      </span>
                      <p className="text-[10px] text-stone-400 mt-1">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {stats?.recentSignups.length === 0 && <p className="text-stone-500 text-sm">No recent signups.</p>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h2 className="font-headline text-xl font-bold text-stone-900 mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/admin/users" className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors group">
                  <span className="material-symbols-outlined text-stone-400 group-hover:text-primary transition-colors">search</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-700">Find User / Reset Pass</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
                </Link>
                <Link href="/admin/premium" className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors group">
                  <span className="material-symbols-outlined text-stone-400 group-hover:text-gold transition-colors">workspace_premium</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-700">Manage Subscriptions</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
                </Link>
                <Link href="/admin/payments" className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors group">
                  <span className="material-symbols-outlined text-stone-400 group-hover:text-accent transition-colors">receipt_long</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-stone-700">Review Receipts</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 text-sm">chevron_right</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
