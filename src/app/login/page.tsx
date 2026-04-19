'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      if (data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/discover');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl float-animation-delay" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 mb-8 text-sm font-medium text-stone-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Website
          </Link>
          
          <Link href="/" className="flex items-center justify-center gap-3 mb-6 group">
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#9b1c31]">Bhartiya Rishtey</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-bold">Premium Matrimony</p>
            </div>
          </Link>
          <h2 className="font-headline text-3xl font-bold text-stone-900 mb-2">Welcome Back</h2>
          <p className="text-sm text-stone-500">Sign in to continue your journey</p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="ornament-divider">
            <span className="text-xs text-stone-400 font-medium">New here?</span>
          </div>

          <Link href="/signup" className="btn-secondary w-full text-center block py-3">
            Create Your Profile
          </Link>
        </div>

        <p className="text-center mt-6 text-xs text-stone-400">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
