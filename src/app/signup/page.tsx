'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend Validation
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Success -> Redirect to /login
      router.push('/login?registered=true');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl float-animation-delay" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <div>
              <h1 className="font-headline text-2xl font-bold text-[#9b1c31]">Bhartiya Rishtey</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-bold">Premium Matrimony</p>
            </div>
          </Link>
          <h2 className="font-headline text-3xl font-bold text-stone-900 mb-2">Begin Your Story</h2>
          <p className="text-sm text-stone-500">Create your profile to find your match</p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="10 digit mobile number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="ornament-divider mt-6">
            <span className="text-xs text-stone-400 font-medium">Already registered?</span>
          </div>

          <Link href="/login" className="btn-secondary w-full text-center block py-3">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
