'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', gender: '', dateOfBirth: '', heightCm: '',
    religion: '', caste: '', location: '',
    education: '', profession: '', incomeTier: '',
    bio: '',
  });

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        const p = data.profile;
        if (p) {
          setProfile(p);
          // Parse photos
          let parsedPhotos: string[] = [];
          try { parsedPhotos = typeof p.photos === 'string' ? JSON.parse(p.photos) : (Array.isArray(p.photos) ? p.photos : []); } catch { parsedPhotos = []; }
          setPhotos(parsedPhotos.filter(Boolean));
          setForm({
            name: p.fullName ?? '',
            gender: p.gender ?? '',
            dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '',
            heightCm: p.heightCm?.toString() ?? '',
            religion: p.religion ?? '',
            caste: p.caste ?? '',
            location: p.location ?? '',
            education: p.education ?? '',
            profession: p.profession ?? '',
            incomeTier: p.incomeTier ?? '',
            bio: p.bio ?? '',
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxPhotos = 3;
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;

    Array.from(files).slice(0, remaining).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert('Each photo must be under 2MB'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPhotos(prev => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const setAsPrimary = (idx: number) => {
    setPhotos(prev => {
      const arr = [...prev];
      const [photo] = arr.splice(idx, 1);
      return [photo, ...arr];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: {
            name: form.name,
            gender: form.gender,
            dateOfBirth: form.dateOfBirth,
            heightCm: form.heightCm ? parseInt(form.heightCm) : undefined,
          },
          background: { religion: form.religion, caste: form.caste, location: form.location },
          career: { education: form.education, profession: form.profession, incomeTier: form.incomeTier },
          bio: form.bio,
          photos: photos,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <><DashNav /><div className="max-w-4xl mx-auto px-6 py-12"><div className="shimmer h-150 rounded-2xl" /></div></>
  );

  const completionPct = profile?.completionPct ?? 0;

  return (
    <>
      <DashNav />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 animate-fade-in-up">
        {/* Profile Header */}
        <div className="glass-card p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-primary/20 to-gold/20 flex items-center justify-center shrink-0 overflow-hidden">
              {photos[0] ? (
                <img src={photos[0]} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-primary/40">person</span>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-headline text-3xl font-bold text-stone-900">{profile?.fullName ?? 'Your Profile'}</h1>
              <p className="text-sm text-stone-500 mt-1">{profile?.profession ?? ''} {profile?.location ? `• ${profile.location}` : ''}</p>
              <div className="flex items-center gap-3 mt-3 justify-center sm:justify-start">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs font-bold text-primary">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  {completionPct}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {saved && (
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-2 text-sm text-success font-medium animate-fade-in-up">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Profile saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* 📸 Photo Upload Section */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">photo_camera</span> Your Photos
            </h2>
            <p className="text-xs text-stone-400 mb-4">Add at least 1 photo. First photo is your profile picture. (Max 3 photos, 2MB each)</p>

            <div className="grid grid-cols-3 gap-3">
              {/* Existing photos */}
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-3/4 rounded-2xl overflow-hidden group border-2 border-stone-200 hover:border-primary transition-colors">
                  <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  {/* Controls overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button onClick={() => setAsPrimary(idx)} className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors" title="Set as primary">
                        <span className="material-symbols-outlined text-sm text-primary">star</span>
                      </button>
                    )}
                    <button onClick={() => removePhoto(idx)} className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors" title="Remove">
                      <span className="material-symbols-outlined text-sm text-error">delete</span>
                    </button>
                  </div>
                  {/* Primary badge */}
                  {idx === 0 && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                      PROFILE
                    </div>
                  )}
                </div>
              ))}

              {/* Add photo button */}
              {photos.length < 3 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="aspect-3/4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-3xl text-stone-400">add_photo_alternate</span>
                  <span className="text-xs font-medium text-stone-400">Add Photo</span>
                </button>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </div>

          {/* Basic Info */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span> Basic Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Gender</label>
                <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">Select</option>
                  <option value="A Groom">Male (Groom)</option>
                  <option value="A Bride">Female (Bride)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Date of Birth</label>
                <input type="date" className="input-field" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Height (cm)</label>
                <input type="number" className="input-field" value={form.heightCm} onChange={e => setForm({...form, heightCm: e.target.value})} placeholder="e.g., 170" />
              </div>
            </div>
          </div>

          {/* Background */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-gold">diversity_3</span> Background
            </h2>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Religion</label>
                <select className="input-field" value={form.religion} onChange={e => setForm({...form, religion: e.target.value})}>
                  <option value="">Select</option>
                  {['Hindu','Muslim','Sikh','Christian','Buddhist','Jain','Other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Caste / Community</label>
                <input className="input-field" value={form.caste} onChange={e => setForm({...form, caste: e.target.value})} placeholder="e.g., Brahmin" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Location</label>
                <input className="input-field" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g., Mumbai, MH" />
              </div>
            </div>
          </div>

          {/* Career */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-success">work</span> Career & Education
            </h2>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Education</label>
                <input className="input-field" value={form.education} onChange={e => setForm({...form, education: e.target.value})} placeholder="e.g., B.Tech" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Profession</label>
                <input className="input-field" value={form.profession} onChange={e => setForm({...form, profession: e.target.value})} placeholder="e.g., Software Engineer" />
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
            </div>
          </div>

          {/* Bio */}
          <div className="glass-card p-6">
            <h2 className="font-headline text-xl font-bold text-stone-900 mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent">edit_note</span> About You
            </h2>
            <textarea
              className="input-field min-h-30 resize-y"
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              placeholder="Tell potential matches about yourself, your interests, and what you're looking for..."
              maxLength={1000}
            />
            <p className="text-xs text-stone-400 mt-1 text-right">{form.bio.length}/1000</p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Link href="/discover" className="btn-secondary py-3 px-6">Cancel</Link>
            <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-8">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">save</span>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
