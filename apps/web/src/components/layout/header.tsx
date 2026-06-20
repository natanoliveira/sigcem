'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Bell, Menu, Search, HelpCircle, User, Settings, LogOut, ChevronDown, PenLine } from 'lucide-react';
import { CommandSearch } from '@/components/layout/command-search';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { ThemeSwitcher } from '@/components/kibo-ui/theme-switcher';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/* ── Mapa de rota → label legível ── */
const routeLabels: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/sepultamentos': 'Sepultamentos',
  '/cemiterios':    'Cemitérios',
  '/quadras':       'Quadras',
  '/jazigos':       'Jazigos',
  '/falecidos':     'Falecidos',
  '/documentos':    'Documentos',
  '/auditoria':     'Auditoria',
  '/users':         'Usuários',
  '/groups':        'Grupos',
  '/configuracoes': 'Configurações',
  '/avisos':        'Avisos',
  '/perfil':        'Meu Perfil',
};

function usePageTitle() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return { label: 'Início', parent: null };
  const base = '/' + segments[0];
  const label = routeLabels[base] ?? segments[0];
  const isDetail = segments.length > 1;
  return { label, parent: isDetail ? label : null };
}

function getInitials(name?: string | null) {
  if (!name) return 'U';
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function Header() {
  const { data: session } = useSession();
  const { openMobile } = useSidebar();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { label: pageLabel } = usePageTitle();

  const userName  = session?.user?.name  ?? 'Usuário';
  const userEmail = session?.user?.email ?? '';
  const initials  = getInitials(userName);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/api/v1/notices/count').then((d) => setUnreadCount(d?.unread ?? 0)).catch(() => {});
    const interval = setInterval(() => {
      api.get('/api/v1/notices/count').then((d) => setUnreadCount(d?.unread ?? 0)).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    <header className="h-[58px] bg-card border-b border-border flex items-center px-4 gap-3 shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

      {/* ── Hamburger mobile ── */}
      <button
        onClick={openMobile}
        className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* ── Logo mobile ── */}
      <div className="md:hidden flex items-center gap-2 mr-2">
        <Image src="/logo.png" alt="SIGCEM" width={22} height={22} className="rounded" unoptimized />
        <span className="font-[700] text-[13px]">SIGCEM</span>
      </div>

      {/* ── Breadcrumb / título (desktop) ── */}
      <div className="hidden md:flex items-center gap-1.5 text-[13px] flex-1 min-w-0">
        <span className="text-muted-foreground">Início</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-border shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="font-[700] text-foreground truncate">{pageLabel}</span>
      </div>

      {/* ── Search bar ── */}
      <div className="flex-1 max-w-[280px] hidden sm:block">
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-[7px] rounded-[10px]',
            'bg-muted border border-border text-muted-foreground text-[13px]',
            'hover:border-primary/50 hover:bg-background',
            'transition-all duration-150 cursor-pointer',
          )}
        >
          <Search size={13} className="shrink-0" />
          <span className="flex-1 text-left truncate">Buscar...</span>
          <kbd className="hidden lg:inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground/70">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-1 ml-auto">

        {/* DEV badge */}
        {process.env.NODE_ENV !== 'production' && (
          <span className="hidden md:inline text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded font-[700] tracking-wide mr-1">
            DEV
          </span>
        )}

        {/* Theme switcher */}
        <ThemeSwitcher
          value={theme as 'light' | 'dark' | 'system'}
          onChange={setTheme}
          className="scale-[0.85] origin-center"
        />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Notificações */}
        <button
          onClick={() => router.push('/avisos')}
          className="relative h-8 w-8 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Notificações"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-[6px] right-[6px] w-[7px] h-[7px] rounded-full bg-destructive border-[1.5px] border-card" />
          )}
        </button>

        {/* Suporte */}
        <button
          className="h-8 w-8 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Suporte"
        >
          <HelpCircle size={16} />
        </button>

        {/* Changelog / novidades */}
        <button
          className="h-8 w-8 flex items-center justify-center rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Novidades"
        >
          <PenLine size={15} />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* ── User dropdown ── */}
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            'flex items-center gap-2 pl-[5px] pr-[10px] py-[5px] rounded-[12px]',
            'border border-border bg-card',
            'hover:border-primary/40 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.07)]',
            'transition-all cursor-pointer outline-none',
          )}>
            <Avatar className="h-[26px] w-[26px] rounded-[6px]">
              <AvatarFallback className="rounded-[6px] bg-gradient-to-br from-[#5046e4] to-[#7c6af7] text-white text-[10px] font-[700]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-[12px] font-[600] text-foreground max-w-[110px] truncate">
              {userName}
            </span>
            <ChevronDown size={11} className="text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[216px]" sideOffset={8}>

            {/* Cabeçalho do dropdown */}
            <div className="flex items-center gap-2.5 px-2 pt-2 pb-2.5 border-b border-border mb-1">
              <Avatar className="h-9 w-9 rounded-[9px] shrink-0">
                <AvatarFallback className="rounded-[9px] bg-gradient-to-br from-[#5046e4] to-[#7c6af7] text-white text-[12px] font-[700]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[13px] font-[700] text-foreground truncate">{userName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{userEmail || 'sem email'}</p>
                <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0 h-[16px] font-[700] uppercase tracking-wide">
                  Administrador
                </Badge>
              </div>
            </div>

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push('/perfil')}>
                <User className="mr-2 h-[15px] w-[15px]" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
                <Settings className="mr-2 h-[15px] w-[15px]" />
                Preferências
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono bg-muted px-1 rounded border border-border">⌘,</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/avisos')}>
                <Bell className="mr-2 h-[15px] w-[15px]" />
                Notificações
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[9px] h-[16px] px-1.5">{unreadCount}</Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <LogOut className="mr-2 h-[15px] w-[15px]" />
                Sair da conta
                <span className="ml-auto text-[10px] text-muted-foreground/60 font-mono bg-muted px-1 rounded border border-border">⌘Q</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </>
  );
}
