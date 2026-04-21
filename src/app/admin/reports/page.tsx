'use client';

import { useState, useEffect, useCallback } from 'react';
import DashNav from '@/components/DashNav';

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string | null;
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN';
  createdAt: string;
  reporter: { name: string; email: string };
  reported: { name: string; email: string; profile?: { fullName: string } };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/report${filter ? `?status=${filter}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAction = async (reportId: string, status: string) => {
    setProcessingId(reportId);
    try {
      const res = await fetch('/api/report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status })
      });
      if (!res.ok) throw new Error('Action failed');
      
      // Update local state
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status as any } : r));
    } catch (err) {
      alert('Failed to update report status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50';
      case 'REVIEWED': return 'text-blue-600 bg-blue-50';
      case 'DISMISSED': return 'text-stone-400 bg-stone-50';
      case 'ACTION_TAKEN': return 'text-red-600 bg-red-50';
      default: return 'text-stone-600 bg-stone-50';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      <DashNav />
      
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-2">Community Reports</h1>
            <p className="text-sm text-stone-400 font-medium">Manage user safety and platform standards</p>
          </div>

          <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-stone-100">
            {['', 'PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  filter === s 
                    ? 'bg-stone-900 text-white shadow-lg' 
                    : 'text-stone-400 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {s || 'ALL'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-stone-200/50 overflow-hidden border border-stone-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Reporter</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Reported User</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Reason / Description</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-8 py-6"><div className="h-4 bg-stone-100 rounded-full w-full" /></td>
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-24 text-center">
                      <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-stone-200 text-3xl">inbox</span>
                      </div>
                      <p className="text-sm text-stone-400 font-bold uppercase tracking-widest">No reports found</p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="hover:bg-stone-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="font-bold text-stone-900 text-sm">{report.reporter.name}</div>
                        <div className="text-[10px] text-stone-400 font-medium">{report.reporter.email}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-stone-900 text-sm">{report.reported.profile?.fullName || report.reported.name}</div>
                        <div className="text-[10px] text-stone-400 font-medium">{report.reported.email}</div>
                      </td>
                      <td className="px-8 py-6 max-w-xs">
                        <div className="text-xs font-black text-primary uppercase tracking-tight mb-1">{report.reason}</div>
                        <div className="text-xs text-stone-500 line-clamp-2 font-medium">{report.description || 'No description provided.'}</div>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black text-stone-400">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                          {report.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleAction(report.id, 'REVIEWED')}
                                disabled={!!processingId}
                                className="w-8 h-8 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-blue-600 hover:border-blue-100 flex items-center justify-center transition-all active:scale-90"
                                title="Mark Reviewed"
                              >
                                <span className="material-symbols-outlined text-lg">check</span>
                              </button>
                              <button 
                                onClick={() => handleAction(report.id, 'ACTION_TAKEN')}
                                disabled={!!processingId}
                                className="w-8 h-8 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition-all active:scale-90"
                                title="Restrict User"
                              >
                                <span className="material-symbols-outlined text-lg">block</span>
                              </button>
                              <button 
                                onClick={() => handleAction(report.id, 'DISMISSED')}
                                disabled={!!processingId}
                                className="w-8 h-8 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-stone-900 hover:border-stone-300 flex items-center justify-center transition-all active:scale-90"
                                title="Dismiss"
                              >
                                <span className="material-symbols-outlined text-lg">close</span>
                              </button>
                            </>
                          )}
                          {(report.status === 'REVIEWED' || report.status === 'DISMISSED') && (
                             <button 
                                onClick={() => handleAction(report.id, 'ACTION_TAKEN')}
                                disabled={!!processingId}
                                className="w-8 h-8 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-red-600 hover:border-red-100 flex items-center justify-center transition-all active:scale-90"
                                title="Restrict User"
                             >
                               <span className="material-symbols-outlined text-lg">block</span>
                             </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
