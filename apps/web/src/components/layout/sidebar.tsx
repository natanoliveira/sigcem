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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/providers/sidebar-provider';

const navGroups = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
      { label: 'Sepultamentos', href: '/sepultamentos',  icon: Shovel },
    ],
  },
  {
    label: 'Estrutura',
    items: [
      { label: 'Cemitérios', href: '/cemiterios', icon: Building2 },
      { label: 'Quadras',    href: '/quadras',    icon: Grid3x3 },
      { label: 'Jazigos',    href: '/jazigos',    icon: MapPin },
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
      { label: 'Documentos',    href: '/documentos',    icon: FileText },
      { label: 'Auditoria',     href: '/auditoria',     icon: ClipboardList },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        'bg-white border-r border-neutral-200 flex flex-col shrink-0 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Botão de recolher */}
      <div className="flex items-center justify-end border-b border-neutral-100 h-10 px-2 shrink-0">
        <button
          onClick={toggle}
          className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="px-4 py-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            {collapsed && <div className="my-1 mx-2 border-t border-neutral-100" />}

            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 py-2 text-sm transition-colors',
                    collapsed ? 'justify-center px-0' : 'px-4',
                    active
                      ? 'bg-primary-50 text-primary-700 font-medium border-r-2 border-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                  )}
                >
                  <Icon
                    size={16}
                    className={cn('shrink-0', active ? 'text-primary-600' : 'text-neutral-500')}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
