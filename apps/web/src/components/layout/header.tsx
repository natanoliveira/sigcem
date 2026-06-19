'use client';

import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, User } from 'lucide-react';

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="h-14 bg-primary-900 border-b border-primary-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 bg-primary-600 rounded flex items-center justify-center">
          <span className="text-white text-sm font-bold">S</span>
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">SIGCEM</span>
        {process.env.NODE_ENV !== 'production' && (
          <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded font-medium">
            DEV
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="text-primary-300 hover:text-white transition-colors p-1.5 rounded">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 text-sm text-primary-200">
          <User size={16} />
          <span>{session?.user?.name ?? 'Usuário'}</span>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-primary-300 hover:text-white transition-colors p-1.5 rounded"
          title="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
