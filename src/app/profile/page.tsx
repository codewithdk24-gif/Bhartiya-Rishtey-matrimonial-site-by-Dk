'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import DashNav from '@/components/DashNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// --- Helper Components ---

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[10px] font-bold text-rose-500 mt-1.5 ml-1 animate-fade-in-up">
      {message}
    </p>
  );
}

function ChipSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  error,
  columns = 2
}: { 
  label: string; 
  options: { label: string; value: string; icon?: string }[]; 
  value: string; 
  onChange: (v: string) => void;
  error?: string;
  columns?: number;
}) {
  return (
    <div className="py-2">
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">{label}</label>
      <div className={`grid gap-2 mt-3`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-black transition-all border-2 ${
              value === opt.value 
              ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-sm scale-[1.02]' 
              : 'bg-stone-50 border-transparent text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            {opt.icon && <span className="material-symbols-outlined text-lg">{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>
      <ErrorText message={error} />
    </div>
  );
}

// --- Main Page ---

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', gender: '', dateOfBirth: '', heightCm: '',
    religion: '', caste: '', location: '',
    education: '', profession: '', incomeTier: '',
    bio: '',
  });

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const completionPct = useMemo(() => {
    const requiredFields = [
      photos.length > 0,
      form.name.length >= 3,
      form.gender !== '',
      calculateAge(form.dateOfBirth) >= 18,
      parseInt(form.heightCm) >= 120 && parseInt(form.heightCm) <= 220,
      form.religion !== '',
      form.location !== '',
      form.education !== '',
      form.profession !== '',
      form.bio.length >= 50
    ];
    const filled = requiredFields.filter(Boolean).length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [form, photos]);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        const p = data.profile;
        if (p) {
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
    const maxPhotos = 5;
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) return;

    Array.from(files).slice(0, remaining).forEach(file => {
      if (file.size > 2 * 1024 * 1024) { alert('Each photo must be under 2MB'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setPhotos(prev => [...prev, base64]);
        setErrors(prev => { const n = {...prev}; delete n.photos; return n; });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    if (confirm('Are you sure you want to remove this photo?')) {
      setPhotos(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const setAsPrimary = (idx: number) => {
    setPhotos(prev => {
      const arr = [...prev];
      const [photo] = arr.splice(idx, 1);
      return [photo, ...arr];
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (photos.length === 0) newErrors.photos = "Add at least 1 profile photo";
    if (form.name.length < 3) newErrors.name = "Enter a valid full name";
    if (!form.gender) newErrors.gender = "Please select your gender";
    if (!form.dateOfBirth || calculateAge(form.dateOfBirth) < 18) newErrors.dateOfBirth = "You must be 18+";
    const h = parseInt(form.heightCm);
    if (!h || h < 120 || h > 220) newErrors.heightCm = "Enter valid height (120–220 cm)";
    if (!form.religion) newErrors.religion = "Select religion";
    if (!form.location) newErrors.location = "Location is required";
    if (!form.education) newErrors.education = "Education is required";
    if (!form.profession) newErrors.profession = "Profession is required";
    if (form.bio.length < 50) newErrors.bio = `Bio too short (${form.bio.length}/50 min)`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = validate();
    if (!isValid) {
      const firstError = document.querySelector('.border-rose-500, .ring-rose-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    setShowSuccess(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInfo: {
            name: form.name,
            gender: form.gender,
            dateOfBirth: form.dateOfBirth,
            heightCm: parseInt(form.heightCm),
          },
          background: { religion: form.religion, caste: form.caste, location: form.location },
          career: { education: form.education, profession: form.profession, incomeTier: form.incomeTier },
          bio: form.bio,
          photos: photos,
        }),
      });
      
      if (res.ok) {
        setShowSuccess(true);
        const data = await res.json();
        if (data.isProfileComplete) {
          await update({ isProfileComplete: true });
        }
        setTimeout(() => setShowSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <><DashNav /><div className="max-w-4xl mx-auto px-6 py-12"><div className="shimmer h-150 rounded-[2.5rem]" /></div></>
  );

  return (
    <div className="bg-[#FDFCFB] min-h-screen">
      <DashNav />
      <div className="max-w-3xl mx-auto px-4 py-10 pb-32">
        
        {/* Premium Profile Header Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 text-center mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-rose-50 to-transparent opacity-50" />
          
          <div className="relative z-10">
            {/* Profile Image with Edit Overlay */}
            <div className="relative mx-auto w-28 h-28 mb-4">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl bg-stone-100">
                {photos[0] ? (
                  <img src={photos[0]} alt={form.name} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-50">
                    <span className="material-symbols-outlined text-4xl text-stone-200">person</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => document.getElementById('section-photos')?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-1 right-1 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 transition-colors active:scale-90"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>

            {/* User Primary Info */}
            <h2 className="text-2xl font-black text-stone-900 tracking-tight">
              {form.name || 'Your Name'}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1.5 text-stone-500 font-medium">
              <span className="text-sm">{form.profession || 'Profession'}</span>
              <span className="w-1 h-1 bg-stone-300 rounded-full" />
              <span className="text-sm">{form.location || 'Location'}</span>
            </div>

            {/* Completion Progress Container */}
            <div className="mt-8 max-w-xs mx-auto">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="inline-flex items-center gap-2 bg-rose-50 px-4 py-1.5 rounded-full">
                  <span className="text-xs font-black text-rose-600 tracking-wider">{completionPct}%</span>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Complete</span>
                </div>
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                  {completionPct === 100 ? 'Perfect' : 'Keep Going'}
                </span>
              </div>
              
              {/* Sleek Progress Bar */}
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden shadow-inner p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${
                    completionPct === 100 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Photos */}
          <section id="section-photos" className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                    <span className="material-symbols-outlined text-rose-600">photo_camera</span>
                    Your Photos
                  </h2>
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{photos.length}/5</span>
                </div>
                <p className="text-xs font-medium text-stone-400 mb-6">At least 1 high-quality photo required for visibility.</p>
                
                <div className="grid grid-cols-2 min-[400px]:grid-cols-3 sm:grid-cols-5 gap-4">
                  {photos.map((p, i) => (
                    <div 
                      key={i} 
                      onClick={() => i !== 0 && setAsPrimary(i)}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden group border-2 transition-all cursor-pointer ${
                        i === 0 ? 'border-rose-500 shadow-xl scale-[1.02] z-10' : 'border-transparent hover:border-rose-200'
                      }`}
                    >
                      <img src={p} className="w-full h-full object-cover" alt="" />
                      
                      {/* Primary Badge */}
                      {i === 0 && (
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                          Profile
                        </div>
                      )}

                      {/* Hover Overlay for Secondary Photos */}
                      {i !== 0 && (
                        <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-center p-3">
                          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-xl font-bold">star</span>
                          </div>
                          <p className="text-white text-[8px] font-black uppercase tracking-widest">Set as Profile Photo</p>
                        </div>
                      )}

                      {/* Delete Action (Fixed Position) */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); removePhoto(i); }} 
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl text-stone-500 hover:text-rose-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90 flex items-center justify-center border border-stone-100"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">delete</span>
                      </button>
                    </div>
                  ))}
                  {photos.length < 5 && (
                    <button 
                      onClick={() => fileRef.current?.click()}
                      className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                        errors.photos ? 'border-rose-500 bg-rose-50/30' : 'border-stone-200 hover:border-rose-400 hover:bg-rose-50/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-stone-300">add_photo_alternate</span>
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Add Photo</span>
                    </button>
                  )}
                </div>
                <ErrorText message={errors.photos} />
             </div>
             <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
          </section>

          {/* Basic Info */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-rose-600">person</span>
              Basic Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.name ? 'ring-2 ring-rose-500' : ''}`}
                  value={form.name} 
                  onChange={e => {setForm({...form, name: e.target.value}); if(e.target.value.length >= 3) setErrors(p => {const n={...p}; delete n.name; return n;})}} 
                  placeholder="e.g., Arjun Sharma"
                />
                <ErrorText message={errors.name} />
              </div>

              <ChipSelect 
                label="Gender / Identity"
                value={form.gender}
                onChange={(v) => {setForm({...form, gender: v}); setErrors(p => {const n={...p}; delete n.gender; return n;})}}
                error={errors.gender}
                options={[
                  { label: 'Male (Groom)', value: 'A Groom', icon: 'man' },
                  { label: 'Female (Bride)', value: 'A Bride', icon: 'woman' }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <input 
                    type="date" 
                    className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.dateOfBirth ? 'ring-2 ring-rose-500' : ''}`}
                    value={form.dateOfBirth} 
                    onChange={e => {setForm({...form, dateOfBirth: e.target.value}); if(calculateAge(e.target.value) >= 18) setErrors(p => {const n={...p}; delete n.dateOfBirth; return n;})}} 
                  />
                  <ErrorText message={errors.dateOfBirth} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Height (cm)</label>
                  <input 
                    type="number" 
                    inputMode="numeric"
                    className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.heightCm ? 'ring-2 ring-rose-500' : ''}`}
                    value={form.heightCm} 
                    onChange={e => {setForm({...form, heightCm: e.target.value}); const h=parseInt(e.target.value); if(h>=120 && h<=220) setErrors(p => {const n={...p}; delete n.heightCm; return n;})}} 
                    placeholder="e.g., 175"
                  />
                  <ErrorText message={errors.heightCm} />
                </div>
              </div>
            </div>
          </section>

          {/* Background & Career */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-rose-600">work</span>
              Background & Career
            </h2>
            <div className="space-y-6">
              <ChipSelect 
                label="Religion"
                value={form.religion}
                onChange={(v) => {setForm({...form, religion: v}); setErrors(p => {const n={...p}; delete n.religion; return n;})}}
                error={errors.religion}
                columns={3}
                options={[
                  { label: 'Hindu', value: 'Hindu' },
                  { label: 'Muslim', value: 'Muslim' },
                  { label: 'Sikh', value: 'Sikh' },
                  { label: 'Christian', value: 'Christian' },
                  { label: 'Buddhist', value: 'Buddhist' },
                  { label: 'Jain', value: 'Jain' }
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.location ? 'ring-2 ring-rose-500' : ''}`}
                    value={form.location} 
                    onChange={e => {setForm({...form, location: e.target.value}); if(e.target.value) setErrors(p => {const n={...p}; delete n.location; return n;})}} 
                    placeholder="e.g., Mumbai, MH"
                  />
                  <ErrorText message={errors.location} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Highest Education</label>
                  <input 
                    className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.education ? 'ring-2 ring-rose-500' : ''}`}
                    value={form.education} 
                    onChange={e => {setForm({...form, education: e.target.value}); if(e.target.value) setErrors(p => {const n={...p}; delete n.education; return n;})}} 
                    placeholder="e.g., MBA, B.Tech"
                  />
                  <ErrorText message={errors.education} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Current Profession</label>
                <input 
                  className={`w-full bg-stone-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-stone-900 mt-2 focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.profession ? 'ring-2 ring-rose-500' : ''}`}
                  value={form.profession} 
                  onChange={e => {setForm({...form, profession: e.target.value}); if(e.target.value) setErrors(p => {const n={...p}; delete n.profession; return n;})}} 
                  placeholder="e.g., Data Scientist"
                />
                <ErrorText message={errors.profession} />
              </div>

              <ChipSelect 
                label="Annual Income"
                value={form.incomeTier}
                onChange={(v) => setForm({...form, incomeTier: v})}
                columns={2}
                options={[
                  { label: 'Below ₹5 Lakh', value: 'Below 5L' },
                  { label: '₹5 - 10 Lakh', value: '5-10L' },
                  { label: '₹10 - 20 Lakh', value: '10-20L' },
                  { label: '₹20 - 50 Lakh', value: '20-50L' },
                  { label: '₹50 Lakh+', value: '50L+' }
                ]}
              />
            </div>
          </section>

          {/* Bio */}
          <section className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-600">edit_note</span>
                About You
              </h2>
              <span className={`text-[10px] font-black uppercase tracking-widest ${form.bio.length >= 50 ? 'text-emerald-500' : 'text-stone-400'}`}>
                {form.bio.length}/50 min
              </span>
            </div>
            <p className="text-xs font-medium text-stone-400 mb-6">Write something meaningful about your values and partner expectations.</p>
            <textarea
              className={`w-full bg-stone-50 border-none rounded-3xl px-6 py-5 text-sm font-medium text-stone-900 min-h-[160px] focus:ring-2 focus:ring-rose-500/20 transition-all ${errors.bio ? 'ring-2 ring-rose-500' : ''}`}
              value={form.bio}
              onChange={e => {setForm({...form, bio: e.target.value}); if(e.target.value.length >= 50) setErrors(p => {const n={...p}; delete n.bio; return n;})}}
              placeholder="Tell potential matches about yourself, your hobbies, and what you're looking for..."
              maxLength={1000}
            />
            <ErrorText message={errors.bio} />
          </section>

          {/* Save Action */}
          <div className="flex items-center gap-4 pt-4">
             <button 
               onClick={() => router.push('/discover')}
               className="flex-1 py-5 rounded-[2rem] bg-white border border-stone-100 font-black text-stone-400 uppercase tracking-widest text-xs hover:bg-stone-50 transition-all active:scale-95"
             >
               Cancel
             </button>
             <button 
               onClick={handleSave} 
               disabled={saving}
               className="flex-[2] py-5 rounded-[2rem] bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-rose-600/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
             >
               {saving ? (
                 <>
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Saving...
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined text-lg">verified</span>
                   Save Changes
                 </>
               )}
             </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in zoom-in duration-300">
          <div className="bg-stone-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <span className="material-symbols-outlined text-emerald-400 font-bold">check_circle</span>
            <span className="text-xs font-black uppercase tracking-widest">Profile Updated Successfully 🎉</span>
          </div>
        </div>
      )}

    </div>
  );
}
