'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, Users, Building2, Home, Shovel, X,
} from 'lucide-react';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

/* ── Tipos de resultado ────────────────────────── */
type SearchResult = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  category: 'deceased' | 'grave' | 'cemetery' | 'burial';
};

const CATEGORY_META: Record<SearchResult['category'], { label: string; icon: React.ElementType; color: string }> = {
  deceased:  { label: 'Falecidos',    icon: Users,     color: 'text-violet-500' },
  grave:     { label: 'Jazigos',      icon: MapPin,    color: 'text-primary' },
  cemetery:  { label: 'Cemitérios',   icon: Building2, color: 'text-cyan-500' },
  burial:    { label: 'Sepultamentos',icon: Shovel,    color: 'text-amber-500' },
};

/* ── Fetch helpers ─────────────────────────────── */
async function searchDeceased(q: string): Promise<SearchResult[]> {
  try {
    const res = await api.get(`/api/v1/deceased?search=${encodeURIComponent(q)}&limit=5`);
    const items: any[] = Array.isArray(res) ? res : (res.data ?? []);
    return items.map((d) => ({
      id: d.id,
      label: d.fullName ?? d.name,
      sublabel: d.cpf ? `CPF ${d.cpf}` : undefined,
      href: `/falecidos/${d.id}`,
      category: 'deceased',
    }));
  } catch { return []; }
}

async function searchGraves(q: string): Promise<SearchResult[]> {
  try {
    const res = await api.get(`/api/v1/graves?search=${encodeURIComponent(q)}&limit=5`);
    const items: any[] = Array.isArray(res) ? res : (res.data ?? []);
    return items.map((g) => ({
      id: g.id,
      label: g.code ?? `Jazigo ${g.id.slice(0, 6)}`,
      sublabel: g.locationRef ?? undefined,
      href: `/jazigos/${g.id}`,
      category: 'grave',
    }));
  } catch { return []; }
}

async function searchCemeteries(q: string): Promise<SearchResult[]> {
  try {
    const res = await api.get(`/api/v1/cemeteries?search=${encodeURIComponent(q)}&limit=5`);
    const items: any[] = Array.isArray(res) ? res : (res.data ?? []);
    return items.map((c) => ({
      id: c.id,
      label: c.name,
      sublabel: c.neighborhood ?? c.address ?? undefined,
      href: `/cemiterios/${c.id}`,
      category: 'cemetery',
    }));
  } catch { return []; }
}

/* ── Componente principal ──────────────────────── */
interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  /* Busca com debounce de 280ms */
  const runSearch = useCallback((q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    startTransition(async () => {
      const [deceased, graves, cemeteries] = await Promise.all([
        searchDeceased(q),
        searchGraves(q),
        searchCemeteries(q),
      ]);
      setResults([...deceased, ...graves, ...cemeteries]);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 280);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  /* Limpa ao fechar */
  useEffect(() => {
    if (!open) { setQuery(''); setResults([]); }
  }, [open]);

  /* ⌘K / Ctrl+K listener global */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onOpenChange]);

  function navigate(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  /* Agrupa resultados por categoria */
  const grouped = Object.entries(CATEGORY_META).reduce<Record<string, SearchResult[]>>((acc, [cat]) => {
    const items = results.filter((r) => r.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  const hasResults = results.length > 0;
  const categories = Object.keys(grouped) as SearchResult['category'][];

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Busca global"
      description="Busque por falecidos, jazigos, cemitérios e sepultamentos"
    >
      <CommandInput
        placeholder="Buscar sepultamento, jazigo, falecido..."
        value={query}
        onValueChange={setQuery}
        className="text-[13px]"
      />

      <CommandList>
        {/* Estado vazio ou loading */}
        {query.length < 2 && (
          <CommandEmpty className="py-8 text-center text-[13px] text-muted-foreground">
            <p>Digite ao menos 2 caracteres para buscar.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {Object.entries(CATEGORY_META).map(([, meta]) => {
                const Icon = meta.icon;
                return (
                  <span key={meta.label} className={cn('flex items-center gap-1.5 text-[11px] font-[500] px-2.5 py-1 rounded-full bg-muted', meta.color)}>
                    <Icon size={11} />
                    {meta.label}
                  </span>
                );
              })}
            </div>
          </CommandEmpty>
        )}

        {query.length >= 2 && isPending && (
          <CommandEmpty className="py-8 text-center text-[13px] text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Buscando...
            </div>
          </CommandEmpty>
        )}

        {query.length >= 2 && !isPending && !hasResults && (
          <CommandEmpty className="py-8 text-center text-[13px] text-muted-foreground">
            Nenhum resultado para <span className="font-[600] text-foreground">"{query}"</span>
          </CommandEmpty>
        )}

        {/* Resultados agrupados */}
        {categories.map((cat, idx) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const items = grouped[cat];
          return (
            <div key={cat}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup
                heading={
                  <span className={cn('flex items-center gap-1.5 text-[10px] font-[700] uppercase tracking-wider', meta.color)}>
                    <Icon size={10} />
                    {meta.label}
                  </span>
                }
              >
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.category}-${item.label}-${item.id}`}
                    onSelect={() => navigate(item.href)}
                    className="flex items-center gap-3 py-2.5 px-2 cursor-pointer"
                  >
                    <div className={cn('w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 bg-muted', meta.color)}>
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-[500] text-foreground truncate">{item.label}</p>
                      {item.sublabel && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
                      )}
                    </div>
                    <kbd className="text-[9px] text-muted-foreground font-mono hidden group-data-[selected=true]:flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded border border-border">
                      ↵
                    </kbd>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}

        {/* Atalhos de navegação rápida */}
        {!hasResults && query.length < 2 && (
          <CommandGroup heading={<span className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Navegação rápida</span>}>
            {[
              { label: 'Dashboard',     href: '/dashboard',    icon: Home },
              { label: 'Sepultamentos', href: '/sepultamentos', icon: Shovel },
              { label: 'Falecidos',     href: '/falecidos',    icon: Users },
              { label: 'Jazigos',       href: '/jazigos',      icon: MapPin },
              { label: 'Cemitérios',    href: '/cemiterios',   icon: Building2 },
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <CommandItem
                  key={nav.href}
                  value={`nav-${nav.label}`}
                  onSelect={() => navigate(nav.href)}
                  className="flex items-center gap-3 py-2 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                    <Icon size={13} />
                  </div>
                  <span className="text-[13px] font-[500]">{nav.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/50">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border rounded px-1 font-mono">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border rounded px-1 font-mono">↵</kbd> abrir</span>
          <span className="flex items-center gap-1"><kbd className="bg-background border border-border rounded px-1 font-mono">ESC</kbd> fechar</span>
        </div>
        <span className="text-[10px] text-muted-foreground/60 font-mono">⌘K</span>
      </div>
    </CommandDialog>
  );
}
