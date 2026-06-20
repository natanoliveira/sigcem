'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Bell, User, Menu } from 'lucide-react';
import { useSidebar } from '@/components/providers/sidebar-provider';

export function Header() {
  const { data: session } = useSession();
  const { openMobile } = useSidebar();

  return (
    <header className="h-14 bg-primary-900 border-b border-primary-800 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger — visível apenas em mobile */}
        <button
          onClick={openMobile}
          className="md:hidden p-1.5 rounded text-primary-300 hover:text-white transition-colors"
          title="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <Image src="/logo.png" alt="SIGCEM" width={28} height={28} className="rounded" unoptimized />
        <span className="text-white font-semibold text-sm tracking-wide">SIGCEM</span>
        {process.env.NODE_ENV !== 'production' && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-medium">
            DEV
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="text-primary-300 hover:text-white transition-colors p-1.5 rounded" title="Notificações">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 text-sm text-primary-200">
          <User size={16} />
          <span className="hidden sm:inline">{session?.user?.name ?? 'Usuário'}</span>
        </div>
      </div>
    </header>
  );
}
