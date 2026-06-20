'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye, Shovel } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { BurialDrawer } from '@/components/burial/burial-drawer';

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  INHUMATION: { label: 'Inumação', className: 'bg-blue-500/10 text-blue-600 ring-blue-500/20' },
  EXHUMATION: { label: 'Exumação', className: 'bg-amber-500/10 text-amber-600 ring-amber-500/20' },
  TRANSFER:   { label: 'Translado', className: 'bg-violet-500/10 text-violet-600 ring-violet-500/20' },
};

interface Burial {
  id: string;
  type: string;
  eventDate: string;
  authorizedBy: string;
  funeralHome: string | null;
  deceased: { id: string; fullName: string };
  grave: { id: string; code: string; block: { code: string; cemetery: { name: string } } };
}

interface ApiResponse {
  data: Burial[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TIPO_CONFIG[type] ?? { label: type, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-[600] ring-1 ring-inset', cfg.className)}>
      {cfg.label}
    </span>
  );
}

export default function SepultamentosPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drawerBurialId, setDrawerBurialId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (tipoFilter) params.set('type', tipoFilter);
      const data = await api.get(`/api/v1/burials?${params}`);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, tipoFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const Pagination = () => result && result.meta.totalPages > 1 ? (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[13px] text-muted-foreground">
      <span>{result.meta.total} registros — pág. {result.meta.page}/{result.meta.totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">Anterior</button>
        <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page === result.meta.totalPages}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">Próxima</button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sepultamentos"
        description="Inumações, exumações e translados registrados"
        breadcrumbs={[{ label: 'Operação' }, { label: 'Sepultamentos' }]}
        action={
          <Link href="/sepultamentos/novo"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus size={15} />Novo registro
          </Link>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <select value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Todos os tipos</option>
            <option value="INHUMATION">Inumação</option>
            <option value="EXHUMATION">Exumação</option>
            <option value="TRANSFER">Translado</option>
          </select>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : result?.data.length === 0 ? (
            <EmptyState icon={Shovel}
              title="Nenhum sepultamento registrado."
              description={!tipoFilter ? "Toque em 'Novo registro' para registrar uma operação." : undefined}
            />
          ) : (
            <div className="p-3 space-y-3">
              {result?.data.map((b) => (
                <div key={b.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link href={`/falecidos/${b.deceased.id}`} className="text-[14px] font-[700] text-foreground hover:text-primary hover:underline truncate">
                      {b.deceased.fullName}
                    </Link>
                    <TypeBadge type={b.type} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Link href={`/jazigos/${b.grave.id}`} className="font-mono text-primary hover:underline">{b.grave.code}</Link>
                    <span>·</span>
                    <span className="truncate">{b.grave.block.cemetery.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-[12px] text-muted-foreground">{formatDate(b.eventDate)}</span>
                    <button onClick={() => setDrawerBurialId(b.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Tipo', 'Falecido', 'Jazigo', 'Data', 'Funerária'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Shovel}
                  title="Nenhum sepultamento registrado."
                  description={!tipoFilter ? "Clique em 'Novo registro' para registrar uma operação." : undefined}
                /></td></tr>
              ) : (
                result?.data.map((b) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><TypeBadge type={b.type} /></td>
                    <td className="px-4 py-3">
                      <Link href={`/falecidos/${b.deceased.id}`} className="font-[600] text-foreground hover:text-primary hover:underline">
                        {b.deceased.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/jazigos/${b.grave.id}`} className="font-mono text-primary hover:underline">{b.grave.code}</Link>
                      <span className="text-[11px] text-muted-foreground/70 ml-1.5">— {b.grave.block.cemetery.name}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(b.eventDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground/70 text-[12px]">{b.funeralHome ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDrawerBurialId(b.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted inline-flex">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination />
        </div>
      </div>

      <BurialDrawer
        burialId={drawerBurialId}
        open={!!drawerBurialId}
        onClose={() => setDrawerBurialId(null)}
      />
    </div>
  );
}
