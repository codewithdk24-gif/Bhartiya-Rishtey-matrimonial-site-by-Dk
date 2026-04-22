'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    age: '',
    gender: '',
    city: '',
    bio: '',
    photoUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        // Update session to reflect completion
        await update({ isProfileComplete: true });
        router.replace('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {/* Texture Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/pollen.png")' }} />

      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl shadow-stone-200/50 overflow-hidden relative z-10">
        {/* Header Decor */}
        <div className="h-4 bg-gradient-to-r from-primary via-gold to-primary" />
        
        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h1 className="font-headline text-4xl font-black text-stone-900 mb-2">Complete Your Profile</h1>
            <p className="text-stone-500 font-medium">Just a few more details to help you find the perfect match.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-widest px-1">Your Age</label>
                <input
                  type="number"
                  min="18"
                  max="70"
                  required
                  className="w-full h-14 px-6 rounded-2xl bg-stone-50 border-2 border-stone-100 focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold"
                  placeholder="e.g. 25"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-widest px-1">Gender</label>
                <select
                  required
                  className="w-full h-14 px-6 rounded-2xl bg-stone-50 border-2 border-stone-100 focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold appearance-none"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-widest px-1">City / Location</label>
              <input
                type="text"
                required
                className="w-full h-14 px-6 rounded-2xl bg-stone-50 border-2 border-stone-100 focus:border-primary focus:bg-white transition-all outline-none text-sm font-bold"
                placeholder="e.g. Mumbai, Delhi"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-widest px-1">About You (Bio)</label>
              <textarea
                required
                rows={4}
                className="w-full p-6 rounded-2xl bg-stone-50 border-2 border-stone-100 focus:border-primary focus:bg-white transition-all outline-none text-sm font-medium resize-none"
                placeholder="Tell us about yourself, your values and what you're looking for..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            {/* Photo URL (Optional for now as per task) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-widest px-1">Photo URL (Optional)</label>
              <input
                type="url"
                className="w-full h-14 px-6 rounded-2xl bg-stone-50 border-2 border-stone-100 focus:border-primary focus:bg-white transition-all outline-none text-sm font-medium"
                placeholder="https://example.com/photo.jpg"
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white text-base font-black shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Save & Continue
                  <span className="material-symbols-outlined">rocket_launch</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
