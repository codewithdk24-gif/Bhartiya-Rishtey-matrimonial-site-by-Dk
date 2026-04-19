'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to request reset');
        return;
      }

      setStatus('success');
      setMessage(data.message);
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

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
          <h2 className="font-headline text-3xl font-bold text-stone-900 mb-2">Reset Password</h2>
          <p className="text-sm text-stone-500">Enter your email to receive recovery instructions</p>
        </div>

        <div className="glass-card p-8">
          {status === 'success' ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-success text-3xl">mark_email_read</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-stone-900 mb-2">Check your email</h3>
              <p className="text-sm text-stone-500 mb-6">{message}</p>
              <Link href="/login" className="btn-primary w-full py-3.5 block">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'error' && (
                <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {message}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full py-3.5 mt-2">
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {status !== 'success' && (
            <Link href="/login" className="btn-secondary w-full text-center block py-3 mt-6">
              Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
