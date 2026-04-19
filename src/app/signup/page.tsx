'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      // Auto-login after registration
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (loginRes.ok) {
        router.push('/onboarding');
      } else {
        router.push('/login');
      }
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
              <h1 className="font-headline text-2xl font-bold text-stone-900">Bhartiya Rishtey</h1>
              <p className="text-[10px] tracking-[0.25em] uppercase text-stone-400 font-bold">Premium Matrimony</p>
            </div>
          </Link>
          <h2 className="font-headline text-3xl font-bold text-stone-900 mb-2">Begin Your Story</h2>
          <p className="text-sm text-stone-500">Create your profile in 2 minutes</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          <div className={`h-1.5 rounded-full flex-1 transition-colors ${step >= 1 ? 'bg-primary' : 'bg-stone-200'}`} />
          <div className={`h-1.5 rounded-full flex-1 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-stone-200'}`} />
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3 text-sm text-error font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
                  <input
                    id="signup-name"
                    type="text"
                    className="input-field"
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
                  <input
                    id="signup-phone"
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (form.fullName && form.phone) setStep(2);
                    else setError('Please fill in all fields');
                  }}
                  className="btn-primary w-full py-3.5"
                >
                  Continue
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
                  <input
                    id="signup-email"
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
                    id="signup-password"
                    type="password"
                    className="input-field"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-stone-400 mt-1.5">Must contain uppercase letter and number</p>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 text-xs sm:text-sm">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5 text-xs sm:text-sm">
                    {loading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="ornament-divider">
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
