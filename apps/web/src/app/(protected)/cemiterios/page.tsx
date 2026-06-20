'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Eye, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useConfirm } from '@/components/providers/confirm-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { FormModal } from '@/components/ui/form-modal';
import { CemeteryForm } from '@/components/cemetery/cemetery-form';

interface Cemetery {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  areaM2: number | null;
  capacity: number | null;
  status: string;
  createdAt: string;
}

interface ApiResponse {
  data: Cemetery[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function CemiteriosPage() {
  const confirm = useConfirm();
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const data = await api.get(`/api/v1/cemeteries?${params}`);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  async function handleDelete(cemetery: Cemetery) {
    const ok = await confirm({
      title: 'Excluir cemitério',
      description: `Tem certeza que deseja excluir "${cemetery.name}"? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/cemeteries/${cemetery.id}`);
      fetchData();
    } catch {}
  }

  const ActionButtons = ({ c }: { c: Cemetery }) => (
    <div className="flex items-center gap-1">
      <Link href={`/cemiterios/${c.id}`} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Detalhes">
        <Eye size={15} />
      </Link>
      <Link href={`/cemiterios/${c.id}/editar`} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" title="Editar">
        <Pencil size={15} />
      </Link>
      <button onClick={() => handleDelete(c)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Excluir">
        <Trash2 size={15} />
      </button>
    </div>
  );

  const Pagination = () => result && result.meta.totalPages > 1 ? (
    <div className="px-4 py-3 border-t border-border flex items-center justify-between text-[13px] text-muted-foreground">
      <span>{result.meta.total} cemitérios — pág. {result.meta.page}/{result.meta.totalPages}</span>
      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">
          Anterior
        </button>
        <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page === result.meta.totalPages}
          className="px-3 py-1 border border-border rounded-lg hover:bg-muted disabled:opacity-40 text-[12px]">
          Próxima
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cemitérios"
        description="Gerencie os cemitérios cadastrados no sistema"
        breadcrumbs={[{ label: 'Estrutura' }, { label: 'Cemitérios' }]}
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus size={15} />Novo cemitério
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome, endereço ou bairro..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : result?.data.length === 0 ? (
            <EmptyState icon={Building2}
              title={search ? 'Nenhum cemitério encontrado.' : 'Nenhum cemitério cadastrado.'}
              description={!search ? "Toque em 'Novo cemitério' para começar." : undefined}
            />
          ) : (
            <div className="p-3 space-y-3">
              {result?.data.map((c) => (
                <div key={c.id} className="bg-background border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-[700] text-foreground truncate">{c.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate mt-0.5">{c.address}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {c.neighborhood && <span>{c.neighborhood}</span>}
                      {c.capacity != null && <span>{c.capacity.toLocaleString('pt-BR')} jazigos</span>}
                    </div>
                    <ActionButtons c={c} />
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
                <th className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">Endereço</th>
                <th className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">Bairro</th>
                <th className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">Capacidade</th>
                <th className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr><td colSpan={6}><EmptyState icon={Building2}
                  title={search ? 'Nenhum cemitério encontrado para esta busca.' : 'Nenhum cemitério cadastrado.'}
                  description={!search ? "Clique em 'Novo cemitério' para começar." : undefined}
                /></td></tr>
              ) : (
                result?.data.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-[600] text-foreground">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.address}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.neighborhood ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.capacity != null ? c.capacity.toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <ActionButtons c={c} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination />
        </div>
      </div>

      <FormModal open={createOpen} onOpenChange={setCreateOpen}
        title="Novo cemitério" description="Preencha os dados para cadastrar um novo cemitério.">
        <div className="p-6">
          <CemeteryForm mode="create"
            onSuccess={() => { setCreateOpen(false); fetchData(); }}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </FormModal>
    </div>
  );
}
