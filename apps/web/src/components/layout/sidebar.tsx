'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Grid3x3,
  MapPin,
  Users,
  Shovel,
  FileText,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Sepultamentos', href: '/sepultamentos', icon: Shovel },
    ],
  },
  {
    label: 'Estrutura',
    items: [
      { label: 'Cemitérios', href: '/cemiterios', icon: Building2 },
      { label: 'Quadras', href: '/quadras', icon: Grid3x3 },
      { label: 'Jazigos', href: '/jazigos', icon: MapPin },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Falecidos', href: '/falecidos', icon: Users },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Documentos', href: '/documentos', icon: FileText },
      { label: 'Auditoria', href: '/auditoria', icon: ClipboardList },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col shrink-0 overflow-y-auto">
      <nav className="flex-1 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-4 py-1 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900',
                  )}
                >
                  <Icon size={16} className={active ? 'text-primary-600' : 'text-neutral-700'} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
