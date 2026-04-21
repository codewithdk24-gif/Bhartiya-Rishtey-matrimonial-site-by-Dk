'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

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
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f3] via-[#ffccd5] to-[#ffb3c1] flex items-center justify-center p-0 md:p-10 relative overflow-hidden">
      {/* Falling Rose Petals Effect - High Visibility & Variety */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-6 h-6 bg-white/40 backdrop-blur-sm rounded-tl-full rounded-br-full shadow-lg"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-30px`,
              animation: `fall ${5 + Math.random() * 7}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
              opacity: 0.7 + Math.random() * 0.3
            }}
          />
        ))}
        {[...Array(20)].map((_, i) => (
          <div 
            key={`red-${i}`}
            className="absolute w-4 h-4 bg-[#ff4d6d]/40 rounded-tr-full rounded-bl-full shadow-md"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-30px`,
              animation: `fall ${6 + Math.random() * 6}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fall {
          0% { transform: translateY(-5vh) rotate(0deg) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg) translateX(50px); opacity: 0; }
        }
      `}} />

      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pollen.png")' }} />
      
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-red-200/20 rounded-full blur-[140px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-0 items-stretch relative z-30 bg-white shadow-[0_40px_100px_-20px_rgba(255,77,109,0.15)] md:rounded-[3rem] overflow-hidden md:h-[750px]">
        {/* Left Side: Cinematic Image Section */}
        <div className="hidden md:block relative overflow-hidden group">
          <Image 
            src="/images/signup-bg.png" 
            alt="Indian Wedding Success Story" 
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#ff758f]/80 via-transparent to-black/30" />
          
          <div className="absolute top-10 left-10">
            <Link href="/" className="inline-flex items-center gap-3 group/logo">
              <div className="w-10 h-10 rounded-xl bg-white/30 backdrop-blur-xl flex items-center justify-center border border-white/40 shadow-xl">
                <span className="material-symbols-outlined text-white font-black text-xl">favorite</span>
              </div>
              <div>
                <h1 className="font-headline text-xl font-black text-white leading-tight drop-shadow-md">Bhartiya Rishtey</h1>
                <p className="text-[8px] tracking-[0.3em] uppercase text-white/80 font-black drop-shadow-sm">Premium Matrimony</p>
              </div>
            </Link>
          </div>

          <div className="absolute bottom-12 left-12 right-12 text-white">
             <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-center">
                <p className="text-lg font-black text-white mb-0.5">100%</p>
                <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest leading-tight">Verified Profiles</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-center">
                <p className="text-lg font-black text-white mb-0.5">50K+</p>
                <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest leading-tight">Active Members</p>
              </div>
            </div>
            <h2 className="font-headline text-5xl font-bold leading-[1.1] mb-4 drop-shadow-2xl">
              Begin Your <br />
              <span className="text-white/90">Success Story</span>
            </h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-xs font-medium drop-shadow-lg">
              Create your profile today and find your soulmate.
            </p>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="w-full flex items-center justify-center p-8 md:p-12 relative bg-white">
          <Link href="/" className="absolute top-8 right-10 flex items-center gap-2 text-stone-400 hover:text-[#ff4d6d] transition-all text-[10px] font-black uppercase tracking-widest hover:-translate-x-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>

          <div className="w-full max-w-sm">
            <div className="text-center md:text-left mb-6">
              <div className="md:hidden flex justify-center mb-6">
                 <h1 className="font-headline text-2xl font-black text-[#ff4d6d]">Bhartiya Rishtey</h1>
              </div>
              <h2 className="font-headline text-3xl font-bold text-stone-900 mb-1 tracking-tight">Create Account</h2>
              <p className="text-base text-stone-500 font-medium">Join our premium community</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 font-medium flex items-center gap-2 animate-shake">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="w-full h-12 md:h-13 px-5 rounded-xl md:rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    className="w-full h-12 md:h-13 px-5 rounded-xl md:rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full h-12 md:h-13 px-5 rounded-xl md:rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                    placeholder="10 digit number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                    maxLength={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-1.5">Password</label>
                    <input
                      type="password"
                      className="w-full h-12 md:h-13 px-5 rounded-xl md:rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 mb-1.5">Confirm</label>
                    <input
                      type="password"
                      className="w-full h-12 md:h-13 px-5 rounded-xl md:rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                      placeholder="••••••••"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 rounded-full bg-gradient-to-r from-[#b3122d] to-[#e53935] text-white text-sm font-bold shadow-xl shadow-red-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 group mt-4"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400 font-medium mb-3">Already have an account?</p>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center w-full h-12 rounded-full border-2 border-[#e7ded7] text-stone-600 text-xs font-bold hover:bg-stone-50 hover:border-stone-300 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
