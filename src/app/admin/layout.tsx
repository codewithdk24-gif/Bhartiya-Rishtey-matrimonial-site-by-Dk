'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/admin', label: 'Overview', icon: 'dashboard' },
    { href: '/admin/users', label: 'All Users', icon: 'group' },
    { href: '/admin/premium', label: 'Premium Members', icon: 'workspace_premium' },
    { href: '/admin/payments', label: 'Payments & Revenue', icon: 'receipt_long' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-stone-900 text-stone-400 flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-stone-800">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="text-left">
              <h1 className="font-headline text-lg font-bold text-white">Admin Panel</h1>
              <p className="text-[10px] tracking-[0.2em] uppercase text-stone-500">Bhartiya Rishtey</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-primary/20 text-primary border border-primary/20' 
                  : 'hover:bg-stone-800 hover:text-white'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : 'text-stone-500'}`}>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-stone-800">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-error/20 hover:text-error text-stone-500">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-end px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-stone-500 text-sm">shield_person</span>
            </div>
            <span className="text-sm font-semibold text-stone-700">Super Admin</span>
          </div>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
