'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium mb-6">
          Invalid or missing reset token. Please request a new link.
        </div>
        <Link href="/forgot-password" className="btn-primary w-full py-3.5 block">Request New Link</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Password must be at least 8 characters');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to reset password');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-success text-3xl">check_circle</span>
        </div>
        <h3 className="font-headline text-xl font-bold text-stone-900 mb-2">Password Recovered</h3>
        <p className="text-sm text-stone-500 mb-6">{message}<br/>Redirecting to login...</p>
        <Link href="/login" className="btn-primary w-full py-3.5 block">Go to Login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'error' && (
        <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">New Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Min. 8 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">Confirm Password</label>
        <input
          type="password"
          className="input-field"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full py-3.5 mt-2">
        {status === 'loading' ? 'Updating...' : 'Set New Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative bg-stone-50">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl float-animation-delay" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div className="text-left">
              <h1 className="font-headline text-2xl font-bold text-stone-900">Bhartiya Rishtey</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400">Premium Matrimony</p>
            </div>
          </Link>
          <h2 className="font-headline text-3xl font-bold text-stone-900 mb-2">Create New Password</h2>
          <p className="text-sm text-stone-500">Secure your account with a strong password</p>
        </div>

        <div className="glass-card p-8">
          <Suspense fallback={<div className="text-center py-6">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
