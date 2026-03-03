'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  History,
  Brain,
  Zap,
  Clock,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/sessions', label: 'Sessions', icon: History },
  { href: '/memory', label: 'Memory', icon: Brain },
  { href: '/skills', label: 'Skills', icon: Zap },
  { href: '/cron', label: 'Cron Jobs', icon: Clock },
  { href: '/audit', label: 'Audit Log', icon: Shield },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const nav = (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/20">
            JB
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">JasonBot</span>
            <p className="text-[10px] text-gray-500 -mt-0.5">Your personal Jason Forsythe, just less annoying</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-200">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/chat' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800/50 p-3">
        <button onClick={handleSignOut} className="sidebar-link w-full text-gray-500 hover:text-red-400">
          <LogOut size={18} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-gray-900 border border-gray-800 p-2 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-800/50 bg-gray-950 transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
