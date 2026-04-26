'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashNav from '@/components/DashNav';
import { handleLogout } from '@/lib/logout';
import CustomSelect from '@/components/CustomSelect';

// --- Components ---

function ToggleSetting({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 group cursor-pointer" onClick={() => onChange(!checked)}>
      <div className="flex-1 pr-4">
        <p className="text-sm font-bold text-stone-900 transition-colors">{label}</p>
        {description && <p className="text-[10px] font-medium text-stone-400 mt-0.5">{description}</p>}
      </div>
      <div 
        className={`w-11 h-6 rounded-full transition-all duration-300 relative flex items-center px-1 shadow-inner ${checked ? 'bg-emerald-500' : 'bg-stone-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

function SelectSetting({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="py-2">
      <CustomSelect 
        label={label}
        value={value}
        options={options}
        onChange={onChange}
      />
    </div>
  );
}

function LinkSetting({ label, icon, href, danger = false }: { label: string; icon: string; href?: string; danger?: boolean }) {
  const router = useRouter();
  return (
    <button 
      onClick={() => href && router.push(href)}
      className="w-full flex items-center justify-between py-4 group"
    >
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-[20px] ${danger ? 'text-rose-500' : 'text-stone-400 group-hover:text-primary transition-colors'}`}>{icon}</span>
        <span className={`text-sm font-bold ${danger ? 'text-rose-500' : 'text-stone-600 group-hover:text-stone-900'}`}>{label}</span>
      </div>
      <span className="material-symbols-outlined text-stone-300 text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
    </button>
  );
}

// --- Main Page ---

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [activeSection, setActiveSection] = useState<string | null>('profile');
  const [toast, setToast] = useState<string | null>(null);

  const triggerSave = () => {
    setToast('Saved');
    setTimeout(() => setToast(null), 1500);
  };

  const [settings, setSettings] = useState({
    privacy: { profileVisible: true, showContact: false, hideOnline: false, readReceipts: true },
    notifs: { matches: true, messages: true, interests: true },
    comm: 'accepted',
    ageRange: 35,
    language: 'English'
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => {
      const keys = key.split('.');
      if (keys.length > 1) {
        return {
          ...prev,
          [keys[0]]: { ...prev[keys[0] as keyof typeof prev] as object, [keys[1]]: value }
        };
      }
      return { ...prev, [key]: value };
    });
    triggerSave();
  };

  const toggleSection = (id: string) => {
    setActiveSection(prev => prev === id ? null : id);
  };

  const sections = [
    { id: 'profile', title: 'Profile Settings', icon: 'account_circle' },
    { id: 'matches', title: 'Match Preferences', icon: 'tune' },
    { id: 'privacy', title: 'Privacy & Visibility', icon: 'visibility' },
    { id: 'notifs', title: 'Notifications', icon: 'notifications' },
    { id: 'membership', title: 'Membership', icon: 'diamond' },
    { id: 'comm', title: 'Communication', icon: 'chat' },
    { id: 'safety', title: 'Safety & Security', icon: 'security' },
    { id: 'app', title: 'App Preferences', icon: 'settings_applications' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] transition-colors duration-500">
      <DashNav />
      
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Settings</h1>
          <p className="text-stone-500 text-sm font-medium mt-1">Changes are saved automatically</p>
        </div>

        <div className="space-y-3">
          {sections.map((sec) => (
            <div 
              key={sec.id}
              className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                activeSection === sec.id 
                ? 'border-rose-100 shadow-[0_20px_50px_rgba(0,0,0,0.04)] scale-[1.01]' 
                : 'border-stone-100 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleSection(sec.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-stone-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    activeSection === sec.id ? 'bg-rose-50 text-rose-600' : 'bg-stone-50 text-stone-400'
                  }`}>
                    <span className="material-symbols-outlined text-xl">{sec.icon}</span>
                  </div>
                  <h3 className={`font-black tracking-tight transition-colors ${
                    activeSection === sec.id ? 'text-stone-900' : 'text-stone-500'
                  }`}>{sec.title}</h3>
                </div>
                <span className={`material-symbols-outlined text-stone-300 transition-transform duration-500 ${
                  activeSection === sec.id ? 'rotate-180 text-rose-400' : ''
                }`}>
                  expand_more
                </span>
              </button>

              <div className={`transition-all duration-500 ease-in-out ${
                activeSection === sec.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
              }`}>
                <div className="px-6 pb-10 pt-2">
                  <div className="h-px bg-stone-50 mb-6" />
                  
                  {sec.id === 'profile' && (
                    <div className="space-y-1">
                      <LinkSetting label="Edit Personal Details" icon="edit_square" href="/profile/edit" />
                      <LinkSetting label="Manage Photos" icon="image" href="/profile/photos" />
                      <LinkSetting label="Partner Preferences" icon="favorite" href="/profile/preferences" />
                    </div>
                  )}

                  {sec.id === 'matches' && (
                    <div className="space-y-8 py-2">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm font-bold text-stone-900">Age Preference</p>
                          <span className="text-xs font-black text-rose-600 px-3 py-1 bg-rose-50 rounded-full">18 - {settings.ageRange} Years</span>
                        </div>
                        <input 
                          type="range" 
                          min="18" 
                          max="60" 
                          value={settings.ageRange} 
                          onChange={(e) => updateSetting('ageRange', parseInt(e.target.value))}
                          className="w-full accent-rose-600 h-1.5 bg-stone-100 rounded-full appearance-none cursor-pointer" 
                        />
                      </div>
                      <LinkSetting label="Location Radius" icon="distance" />
                      <LinkSetting label="Community Filters" icon="temple_hindu" />
                    </div>
                  )}

                  {sec.id === 'privacy' && (
                    <div className="divide-y divide-stone-50">
                      <ToggleSetting 
                        label="Profile Discovery" 
                        description="Show your profile to other members" 
                        checked={settings.privacy.profileVisible} 
                        onChange={(v) => updateSetting('privacy.profileVisible', v)} 
                      />
                      <ToggleSetting 
                        label="Contact Privacy" 
                        description="Only shared with matches" 
                        checked={settings.privacy.showContact} 
                        onChange={(v) => updateSetting('privacy.showContact', v)} 
                      />
                      <ToggleSetting 
                        label="Ghost Mode" 
                        description="Hide your active status" 
                        checked={settings.privacy.hideOnline} 
                        onChange={(v) => updateSetting('privacy.hideOnline', v)} 
                      />
                      <LinkSetting label="Manage Blocklist" icon="block" />
                    </div>
                  )}

                  {sec.id === 'notifs' && (
                    <div className="divide-y divide-stone-50">
                      <ToggleSetting 
                        label="Daily Matches" 
                        checked={settings.notifs.matches} 
                        onChange={(v) => updateSetting('notifs.matches', v)} 
                      />
                      <ToggleSetting 
                        label="Chat Messages" 
                        checked={settings.notifs.messages} 
                        onChange={(v) => updateSetting('notifs.messages', v)} 
                      />
                      <ToggleSetting 
                        label="Interests Received" 
                        checked={settings.notifs.interests} 
                        onChange={(v) => updateSetting('notifs.interests', v)} 
                      />
                    </div>
                  )}

                  {sec.id === 'membership' && (
                    <div className="space-y-6">
                      <div className="bg-stone-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-125 transition-all duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-8">
                             <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">Current Status</div>
                             <span className="material-symbols-outlined text-gold text-3xl fill-1">diamond</span>
                          </div>
                          <h4 className="text-2xl font-black mb-1">{session?.user?.role === 'PREMIUM' ? 'Prime Member' : 'Standard Member'}</h4>
                          <p className="text-xs text-white/40 font-bold">Renewal Date: June 12, 2026</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push('/payment')}
                        className="w-full py-5 bg-rose-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Explore Prime Plans
                      </button>
                    </div>
                  )}

                  {sec.id === 'comm' && (
                    <div className="space-y-4">
                      <SelectSetting 
                        label="Messaging Permissions"
                        value={settings.comm}
                        onChange={(v) => updateSetting('comm', v)}
                        options={[
                          { label: 'Only Accepted Matches', value: 'accepted' },
                          { label: 'Anyone (Interest required)', value: 'anyone' },
                          { label: 'Nobody (Pause incoming)', value: 'nobody' }
                        ]}
                      />
                      <ToggleSetting 
                        label="Show Read Receipts" 
                        checked={settings.privacy.readReceipts} 
                        onChange={(v) => updateSetting('privacy.readReceipts', v)} 
                      />
                    </div>
                  )}

                  {sec.id === 'app' && (
                    <div className="space-y-4">
                      <SelectSetting 
                        label="Interface Language"
                        value={settings.language}
                        onChange={(v) => updateSetting('language', v)}
                        options={[
                          { label: 'English', value: 'English' },
                          { label: 'Hindi (हिन्दी)', value: 'Hindi' },
                          { label: 'Marathi (मराठी)', value: 'Marathi' }
                        ]}
                      />
                      <div className="flex items-center justify-between py-4 opacity-60 cursor-not-allowed">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-stone-900">Dark Mode</p>
                            <span className="px-1.5 py-0.5 bg-stone-100 text-[8px] font-black text-stone-400 uppercase tracking-widest rounded">Coming Soon</span>
                          </div>
                          <p className="text-[10px] font-medium text-stone-400 mt-0.5">Easier on your eyes at night</p>
                        </div>
                        <div className="w-11 h-6 rounded-full bg-stone-200 flex items-center px-1">
                          <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                        </div>
                      </div>
                    </div>
                  )}

                  {sec.id === 'safety' && (
                    <div className="divide-y divide-stone-50">
                      <LinkSetting label="Report Content" icon="flag" />
                      <LinkSetting label="Security Tips" icon="lock" />
                      <div className="py-4 flex items-center justify-between">
                        <div>
                           <p className="text-sm font-bold text-stone-900">Profile Verification</p>
                           <p className="text-[10px] text-stone-400 font-medium">Verified by Bhartiya Rishtey</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Account Footer */}
        <div className="mt-12 space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-7 bg-rose-50/30 border border-rose-100/50 rounded-[2.5rem] group hover:bg-rose-50 transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-2xl font-bold">logout</span>
              </div>
              <div className="text-left">
                <h3 className="font-black text-rose-600 tracking-tight">Logout</h3>
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Sign out of this session</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-rose-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>

          <button className="w-full py-6 text-center">
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] hover:text-stone-900 transition-colors cursor-pointer">Deactivate Account</p>
          </button>
        </div>
      </main>

      {/* Floating Success Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in zoom-in duration-300">
          <div className="bg-stone-900/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
            <span className="material-symbols-outlined text-emerald-400 text-lg font-bold">check_circle</span>
            <span className="text-[10px] font-black uppercase tracking-widest">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
