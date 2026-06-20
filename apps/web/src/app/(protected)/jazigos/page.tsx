'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Eye, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useConfirm } from '@/components/providers/confirm-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { FormModal } from '@/components/ui/form-modal';
import { JazigoForm } from '@/components/jazigo/jazigo-form';
import { JazigoDrawer } from '@/components/jazigo/jazigo-drawer';

const TIPO_LABEL: Record<string, string> = {
  SINGLE: 'Simples', DOUBLE: 'Duplo', DRAWER: 'Gaveta',
  OSSUARY: 'Ossário', PERPETUAL: 'Perpétuo',
};

interface Jazigo {
  id: string;
  code: string;
  type: string;
  status: string;
  locationRef: string | null;
  block: { id: string; code: string; cemetery: { id: string; name: string } };
}

interface ApiResponse {
  data: Jazigo[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function JazigosPage() {
  const confirm = useConfirm();
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerJazigoId, setDrawerJazigoId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const data = await api.get(`/api/v1/graves?${params}`);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  async function handleDelete(jazigo: Jazigo) {
    const ok = await confirm({
      title: 'Excluir jazigo',
      description: `Tem certeza que deseja excluir o jazigo "${jazigo.code}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/graves/${jazigo.id}`);
      fetchData();
    } catch {}
  }

  const ActionButtons = ({ j }: { j: Jazigo }) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setDrawerJazigoId(j.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Detalhes">
        <Eye size={15} />
      </button>
      <Link href={`/jazigos/${j.id}/editar`} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" title="Editar">
        <Pencil size={15} />
      </Link>
      <button onClick={() => handleDelete(j)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Excluir">
        <Trash2 size={15} />
      </button>
    </div>
  );

  const Pagination = () => result && result.meta.totalPages > 1 ? (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[13px] text-muted-foreground">
      <span>{result.meta.total} jazigos — pág. {result.meta.page}/{result.meta.totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">Anterior</button>
        <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page === result.meta.totalPages}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">Próxima</button>
      </div>
    </div>
  ) : null;

  const hasFilter = search || statusFilter;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jazigos"
        description="Unidades de sepultamento cadastradas"
        breadcrumbs={[{ label: 'Estrutura' }, { label: 'Jazigos' }]}
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus size={15} />Novo jazigo
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por código ou localização..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Todos os status</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="RESERVED">Reservado</option>
            <option value="BLOCKED">Interditado</option>
          </select>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : result?.data.length === 0 ? (
            <EmptyState icon={MapPin}
              title={hasFilter ? 'Nenhum jazigo encontrado com os filtros aplicados.' : 'Nenhum jazigo cadastrado.'}
              description={!hasFilter ? "Toque em 'Novo jazigo' para começar." : undefined}
            />
          ) : (
            <div className="p-3 space-y-3">
              {result?.data.map((j) => (
                <div key={j.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[15px] font-mono font-[700] text-foreground">{j.code}</span>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{TIPO_LABEL[j.type] ?? j.type}</p>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                    <Link href={`/quadras/${j.block.id}`} className="font-mono text-primary hover:underline">{j.block.code}</Link>
                    <span>·</span>
                    <Link href={`/cemiterios/${j.block.cemetery.id}`} className="truncate hover:text-primary hover:underline">{j.block.cemetery.name}</Link>
                  </div>
                  {j.locationRef && <p className="text-[11px] text-muted-foreground/70 mt-1">{j.locationRef}</p>}
                  <div className="flex justify-end mt-3 pt-3 border-t border-border">
                    <ActionButtons j={j} />
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
                {['Código', 'Tipo', 'Localização', 'Quadra', 'Cemitério', 'Status'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={MapPin}
                  title={hasFilter ? 'Nenhum jazigo encontrado com os filtros aplicados.' : 'Nenhum jazigo cadastrado.'}
                  description={!hasFilter ? "Clique em 'Novo jazigo' para começar." : undefined}
                /></td></tr>
              ) : (
                result?.data.map((j) => (
                  <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-[700] text-foreground">{j.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{TIPO_LABEL[j.type] ?? j.type}</td>
                    <td className="px-4 py-3 text-muted-foreground/70 text-[12px]">{j.locationRef ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quadras/${j.block.id}`} className="text-primary hover:underline font-mono">{j.block.code}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cemiterios/${j.block.cemetery.id}`} className="text-muted-foreground hover:text-primary hover:underline text-[12px]">{j.block.cemetery.name}</Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3"><div className="flex justify-end"><ActionButtons j={j} /></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination />
        </div>
      </div>

      <FormModal open={createOpen} onOpenChange={setCreateOpen}
        title="Novo jazigo" description="Preencha os dados para cadastrar um novo jazigo.">
        <div className="p-6">
          <JazigoForm mode="create"
            onSuccess={() => { setCreateOpen(false); fetchData(); }}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </FormModal>

      <JazigoDrawer
        jazigoId={drawerJazigoId}
        open={!!drawerJazigoId}
        onClose={() => setDrawerJazigoId(null)}
        onStatusChange={fetchData}
      />
    </div>
  );
}
