'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard, Building2, Grid3x3, MapPin,
  Users, Users2, Shield, Shovel, FileText,
  ClipboardList, Settings, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/providers/sidebar-provider';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';

const navGroups = [
  {
    label: 'Operação',
    items: [
      { label: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard },
      { label: 'Sepultamentos', href: '/sepultamentos', icon: Shovel },
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
      { label: 'Usuários',      href: '/users',         icon: Users2 },
      { label: 'Grupos',        href: '/groups',        icon: Shield },
      { label: 'Configurações', href: '/configuracoes', icon: Settings },
    ],
  },
];

function getInitials(name?: string | null) {
  if (!name) return 'U';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();

  const userName = session?.user?.name ?? 'Usuário';
  const initials = getInitials(userName);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          /* base */
          'bg-sidebar border-r border-sidebar-border flex flex-col z-50',
          'transition-all duration-300 ease-in-out',
          /* mobile drawer */
          'fixed inset-y-0 left-0 w-64 md:relative md:inset-y-auto md:left-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0 md:shrink-0',
          /* desktop width */
          collapsed ? 'md:w-[52px] overflow-visible' : 'md:w-[224px] overflow-hidden',
        )}
      >
        {/* ── Logo / header ── */}
        <div className={cn(
          'flex items-center h-[58px] shrink-0 border-b border-sidebar-border',
          collapsed ? 'justify-center' : 'px-4 gap-3',
        )}>
          {/* Mobile close */}
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X size={15} />
          </button>

          {collapsed ? (
            /* logo mark colapsado */
            <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#5046e4] to-[#7c6af7] flex items-center justify-center text-white font-[800] text-[12px] shadow-[0_4px_14px_rgba(80,70,228,0.4)]">
              S
            </div>
          ) : (
            <>
              <div className="w-[30px] h-[30px] rounded-[8px] bg-gradient-to-br from-[#5046e4] to-[#7c6af7] flex items-center justify-center text-white font-[800] text-[12px] shadow-[0_4px_14px_rgba(80,70,228,0.4)] shrink-0">
                S
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-[700] text-sidebar-accent-foreground leading-tight">SIGCEM</div>
                <div className="text-[9px] text-sidebar-foreground/40 font-[500] tracking-[0.05em] uppercase">Gestão de Cemitérios</div>
              </div>
              {/* Desktop collapse button */}
              <button
                onClick={toggle}
                className="p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
                title="Recolher menu"
              >
                <ChevronLeft size={14} />
              </button>
            </>
          )}

          {/* Desktop expand button (collapsed state) */}
          {collapsed && (
            <button
              onClick={toggle}
              className="absolute -right-3 top-5 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground shadow-sm transition-colors hidden md:flex"
              title="Expandir menu"
            >
              <ChevronRight size={12} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden px-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="px-2 pt-3 pb-1 text-[10px] font-[700] uppercase tracking-[0.1em] text-sidebar-foreground/40 select-none">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-2 mx-1 border-t border-sidebar-border" />}

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(item.href + '/');

                const linkEl = (
                  <Link
                    href={item.href}
                    onClick={closeMobile}
                    className={cn(
                      'flex items-center rounded-[8px] text-[13px] font-[500] transition-all duration-150',
                      collapsed
                        ? 'justify-center w-9 h-9 mx-auto'
                        : 'gap-2.5 px-2.5 py-2',
                      active
                        ? [
                            'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10',
                            'text-[#c4bbff]',
                            'border border-sidebar-primary/30',
                          ].join(' ')
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <Icon
                      size={15}
                      className={cn(
                        'shrink-0',
                        active
                          ? 'text-[#a5b4fc] drop-shadow-[0_0_5px_rgba(124,106,247,0.7)]'
                          : 'text-sidebar-foreground/60',
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger className="flex w-full justify-center">
                        {linkEl}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return <div key={item.href}>{linkEl}</div>;
              })}
            </div>
          ))}
        </nav>

        {/* ── User footer ── */}
        {!collapsed && (
          <div className="p-2 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bg-sidebar-accent border border-sidebar-border cursor-pointer hover:border-sidebar-primary/40 transition-colors">
              <div className="w-[28px] h-[28px] rounded-[7px] bg-gradient-to-br from-[#5046e4] to-[#7c6af7] flex items-center justify-center text-white text-[10px] font-[700] shrink-0 shadow-[0_2px_8px_rgba(80,70,228,0.3)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-[600] text-sidebar-accent-foreground leading-tight truncate">{userName}</div>
                <div className="text-[10px] text-sidebar-foreground/40 truncate">Administrador</div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
