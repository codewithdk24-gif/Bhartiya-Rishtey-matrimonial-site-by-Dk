'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  shortId: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    fullName: string;
    isCompleted: boolean;
  }
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [resetLinks, setResetLinks] = useState<Record<string, string>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${search}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const generateResetLink = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users/reset-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setResetLinks((prev) => ({ ...prev, [userId]: data.resetUrl }));
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Reset link copied to clipboard!');
  };

  return (
    <div className="p-8 bg-stone-50 min-h-screen">
      <div className="max-w-7xl mx-auto animate-fade-in-up">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-stone-900">User Management</h1>
          <p className="text-stone-500">Search and manage platform users, verify details, and generate password resets.</p>
        </div>

        <div className="glass-card p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <input
              type="text"
              placeholder="Search by Name, Short ID (e.g. AB12X), Email, or Phone"
              className="input-field flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-primary px-6">Search</button>
          </form>
        </div>

        <div className="glass-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-stone-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-600 text-sm">
                    <th className="p-4 font-semibold uppercase tracking-wider">Short ID</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">User Details</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Contact Info</th>
                    <th className="p-4 font-semibold uppercase tracking-wider">Status</th>
                    <th className="p-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                      <td className="p-4">
                        <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-md tracking-wider">
                          {user.shortId || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-stone-900">{user.profile?.fullName || 'No Profile'}</p>
                        <p className="text-xs text-stone-500">Role: {user.role}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-stone-800 flex items-center gap-1"><span className="material-symbols-outlined text-sm text-stone-400">mail</span> {user.email}</p>
                        <p className="text-sm text-stone-800 flex items-center gap-1"><span className="material-symbols-outlined text-sm text-stone-400">phone</span> {user.phone || 'Not provided'}</p>
                      </td>
                      <td className="p-4">
                        {user.profile?.isCompleted ? (
                           <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">Completed</span>
                        ) : (
                           <span className="text-xs font-semibold text-stone-600 bg-stone-200 px-2 py-1 rounded-full">Incomplete</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {!resetLinks[user.id] ? (
                          <button 
                            onClick={() => generateResetLink(user.id)}
                            className="text-xs font-semibold text-primary hover:text-white border border-primary hover:bg-primary px-3 py-2 rounded-lg transition-colors"
                          >
                            Generate Password Link
                          </button>
                        ) : (
                          <button 
                            onClick={() => copyToClipboard(resetLinks[user.id])}
                            className="text-xs font-semibold text-success border border-success hover:bg-success/10 px-3 py-2 rounded-lg transition-colors flex items-center justify-end w-full gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">content_copy</span> Copy Link
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-500">No users found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
