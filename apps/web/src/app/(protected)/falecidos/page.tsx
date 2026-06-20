'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { EmptyState } from '@/components/ui/empty-state';
import { FormModal } from '@/components/ui/form-modal';
import { DeceasedForm } from '@/components/deceased/deceased-form';
import { DeceasedDrawer } from '@/components/deceased/deceased-drawer';

interface Deceased {
  id: string;
  fullName: string;
  birthDate: string;
  deathDate: string;
  birthPlace: string | null;
  nationality: string | null;
}

interface ApiResponse {
  data: Deceased[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FalecidosPage() {
  const confirm = useConfirm();
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawerDeceasedId, setDrawerDeceasedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const data = await api.get(`/api/v1/deceased?${params}`);
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

  async function handleDelete(deceased: Deceased) {
    const ok = await confirm({
      title: 'Excluir registro',
      description: `Tem certeza que deseja excluir o registro de "${deceased.fullName}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/deceased/${deceased.id}`);
      fetchData();
    } catch {}
  }

  const ActionButtons = ({ d }: { d: Deceased }) => (
    <div className="flex items-center gap-1">
      <button onClick={() => setDrawerDeceasedId(d.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Detalhes">
        <Eye size={15} />
      </button>
      <Link href={`/falecidos/${d.id}/editar`} className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10" title="Editar">
        <Pencil size={15} />
      </Link>
      <button onClick={() => handleDelete(d)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Excluir">
        <Trash2 size={15} />
      </button>
    </div>
  );

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
        title="Falecidos"
        description="Registro de pessoas sepultadas no município"
        breadcrumbs={[{ label: 'Cadastros' }, { label: 'Falecidos' }]}
        action={
          <button onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Plus size={15} />Registrar falecido
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : result?.data.length === 0 ? (
            <EmptyState icon={Users}
              title={search ? 'Nenhum registro encontrado.' : 'Nenhum falecido cadastrado.'}
              description={!search ? "Toque em 'Registrar falecido' para começar." : undefined}
            />
          ) : (
            <div className="p-3 space-y-3">
              {result?.data.map((d) => (
                <div key={d.id} className="bg-background border border-border rounded-xl p-4">
                  <p className="text-[14px] font-[700] text-foreground mb-1">{d.fullName}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <div>
                      <span className="font-[600] uppercase tracking-wide text-[10px]">Nascimento</span>
                      <p>{formatDate(d.birthDate)}</p>
                    </div>
                    <div>
                      <span className="font-[600] uppercase tracking-wide text-[10px]">Falecimento</span>
                      <p>{formatDate(d.deathDate)}</p>
                    </div>
                    {d.birthPlace && (
                      <div className="col-span-2">
                        <span className="font-[600] uppercase tracking-wide text-[10px]">Naturalidade</span>
                        <p>{d.birthPlace}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-3 pt-3 border-t border-border">
                    <ActionButtons d={d} />
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
                {['Nome', 'Nascimento', 'Falecimento', 'Naturalidade'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr><td colSpan={5}><EmptyState icon={Users}
                  title={search ? 'Nenhum registro encontrado.' : 'Nenhum falecido cadastrado.'}
                  description={!search ? "Clique em 'Registrar falecido' para começar." : undefined}
                /></td></tr>
              ) : (
                result?.data.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-[600] text-foreground">{d.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.birthDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(d.deathDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground/70 text-[12px]">{d.birthPlace ?? '—'}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><ActionButtons d={d} /></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination />
        </div>
      </div>

      <FormModal open={createOpen} onOpenChange={setCreateOpen}
        title="Registrar falecido" description="Preencha os dados do registro de falecimento." size="lg">
        <div className="p-6">
          <DeceasedForm mode="create"
            onSuccess={() => { setCreateOpen(false); fetchData(); }}
            onCancel={() => setCreateOpen(false)}
          />
        </div>
      </FormModal>

      <DeceasedDrawer
        deceasedId={drawerDeceasedId}
        open={!!drawerDeceasedId}
        onClose={() => setDrawerDeceasedId(null)}
      />
    </div>
  );
}
