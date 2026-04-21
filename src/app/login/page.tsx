'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

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
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-200/20 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-0 items-stretch relative z-30 bg-white shadow-[0_40px_100px_-20px_rgba(255,77,109,0.15)] md:rounded-[3rem] overflow-hidden md:h-[750px]">
        {/* Left Side: Cinematic Image Section */}
        <div className="hidden md:block relative overflow-hidden group">
          <Image 
            src="/images/login-bg.png" 
            alt="Indian Wedding Couple" 
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-6">
              <div className="flex -space-x-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-stone-300 shadow-md" />
                ))}
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white">
                50,000+ Happy Couples
              </p>
            </div>
            <h2 className="font-headline text-5xl font-bold leading-[1.1] mb-4 drop-shadow-2xl">
              Your Journey <br />
              <span className="text-white/90">Begins Here</span>
            </h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-xs font-medium drop-shadow-lg">
              Connecting hearts through traditions and modern values.
            </p>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="w-full flex items-center justify-center p-8 md:p-16 relative bg-white">
          <Link href="/" className="absolute top-10 right-10 flex items-center gap-2 text-stone-400 hover:text-[#ff4d6d] transition-all text-[10px] font-black uppercase tracking-widest hover:-translate-x-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Home
          </Link>

          <div className="w-full max-w-sm">
            <div className="text-center md:text-left mb-10">
              <div className="md:hidden flex justify-center mb-6">
                 <h1 className="font-headline text-2xl font-black text-[#ff4d6d]">Bhartiya Rishtey</h1>
              </div>
              <h2 className="font-headline text-4xl font-bold text-stone-900 mb-2 tracking-tight">Sign In</h2>
              <p className="text-base text-stone-500 font-medium">Welcome back, let's find your match.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600 font-medium flex items-center gap-2 animate-shake">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  className="w-full h-14 px-6 rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Password</label>
                  <Link href="/forgot-password" title="Coming Soon" className="text-[10px] text-primary hover:underline font-bold">
                    Forgot?
                  </Link>
                </div>
                <input
                  id="login-password"
                  type="password"
                  className="w-full h-14 px-6 rounded-2xl bg-white border-2 border-[#e7ded7] text-stone-900 placeholder:text-stone-300 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium"
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
                className="w-full h-14 rounded-full bg-gradient-to-r from-[#b3122d] to-[#e53935] text-white text-sm font-bold shadow-xl shadow-red-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400 font-medium mb-4">New to Bhartiya Rishtey?</p>
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center w-full h-14 rounded-full border-2 border-[#e7ded7] text-stone-600 text-xs font-bold hover:bg-stone-50 hover:border-stone-300 transition-all"
              >
                Create Your Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
