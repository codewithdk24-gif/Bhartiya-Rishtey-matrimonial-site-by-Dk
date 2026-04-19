'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gender: '', dateOfBirth: '', heightCm: '',
    religion: '', caste: '', location: '',
    education: '', profession: '', incomeTier: '',
    bio: '',
  });

  const totalSteps = 3;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: {
            gender: form.gender,
            dateOfBirth: form.dateOfBirth,
            heightCm: form.heightCm ? parseInt(form.heightCm) : undefined,
          },
          background: { religion: form.religion, caste: form.caste, location: form.location },
          career: { education: form.education, profession: form.profession, incomeTier: form.incomeTier },
          bio: form.bio,
        }),
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl float-animation" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl float-animation-delay" />

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-gold flex items-center justify-center text-white font-headline font-bold text-xl shadow-lg">V</div>
          </Link>
          <h1 className="font-headline text-3xl font-bold text-stone-900 mb-2">Complete Your Profile</h1>
          <p className="text-sm text-stone-500">Help us find your perfect match</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${step > i ? 'bg-primary' : 'bg-stone-200'}`} />
          ))}
        </div>

        <div className="glass-card p-8">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span> About You
              </h2>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">I am looking for</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ v: 'A Groom', l: 'A Bride', icon: 'female' }, { v: 'A Bride', l: 'A Groom', icon: 'male' }].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setForm({ ...form, gender: opt.v })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        form.gender === opt.v ? 'border-primary bg-primary/5 text-primary' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl block mb-1">{opt.icon}</span>
                      <span className="text-sm font-semibold">{opt.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Date of Birth</label>
                <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Height (cm)</label>
                <input type="number" className="input-field" placeholder="e.g., 170" value={form.heightCm} onChange={e => setForm({...form, heightCm: e.target.value})} />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5">
                Continue <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-gold">diversity_3</span> Background
              </h2>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Religion</label>
                <select className="input-field" value={form.religion} onChange={e => setForm({...form, religion: e.target.value})}>
                  <option value="">Select</option>
                  {['Hindu','Muslim','Sikh','Christian','Buddhist','Jain','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Caste / Community</label>
                <input className="input-field" placeholder="e.g., Brahmin, Kshatriya" value={form.caste} onChange={e => setForm({...form, caste: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">City / Location</label>
                <input className="input-field" placeholder="e.g., Mumbai, Maharashtra" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1 py-3.5">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-headline text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-success">work</span> Career & Bio
              </h2>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Education</label>
                <input className="input-field" placeholder="e.g., B.Tech, MBA" value={form.education} onChange={e => setForm({...form, education: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Profession</label>
                <input className="input-field" placeholder="e.g., Software Engineer" value={form.profession} onChange={e => setForm({...form, profession: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Annual Income</label>
                <select className="input-field" value={form.incomeTier} onChange={e => setForm({...form, incomeTier: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Below 5L">Below ₹5 Lakh</option>
                  <option value="5-10L">₹5 - 10 Lakh</option>
                  <option value="10-20L">₹10 - 20 Lakh</option>
                  <option value="20-50L">₹20 - 50 Lakh</option>
                  <option value="50L+">₹50 Lakh+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">About Yourself</label>
                <textarea className="input-field min-h-[100px] resize-y" placeholder="Tell potential matches about yourself..." value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} maxLength={1000} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">Back</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-3.5">
                  {saving ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : 'Complete Profile'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-stone-400">
          You can always update your profile later from the dashboard
        </p>
      </div>
    </div>
  );
}
