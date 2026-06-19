'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Eye, LayoutGrid } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface Quadra {
  id: string;
  code: string;
  name: string | null;
  capacity: number | null;
  status: string;
  cemetery: { id: string; name: string };
  _count: { graves: number };
}

interface ApiResponse {
  data: Quadra[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function QuadrasPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Quadra | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search) params.set('search', search);
      const data = await api.get(`/api/v1/blocks?${params}`);
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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/blocks/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchData();
    } catch {
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quadras"
        description="Seções internas dos cemitérios"
        breadcrumbs={[{ label: 'Estrutura' }, { label: 'Quadras' }]}
        action={
          <Link
            href="/quadras/nova"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            Nova quadra
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por código ou nome..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cemitério</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Jazigos</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Capacidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={LayoutGrid}
                      title={search ? 'Nenhuma quadra encontrada para esta busca.' : 'Nenhuma quadra cadastrada.'}
                      description={!search ? "Clique em 'Nova quadra' para começar." : undefined}
                    />
                  </td>
                </tr>
              ) : (
                result?.data.map((q) => (
                  <tr key={q.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">{q.code}</td>
                    <td className="px-4 py-3 text-neutral-600">{q.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/cemiterios/${q.cemetery.id}`} className="text-primary-600 hover:underline">
                        {q.cemetery.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{q._count.graves}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {q.capacity != null ? q.capacity.toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/quadras/${q.id}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                          title="Detalhes"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/quadras/${q.id}/editar`}
                          className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(q)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {result && result.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-600">
            <span>
              {result.meta.total} quadras — página {result.meta.page} de {result.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
                disabled={page === result.meta.totalPages}
                className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir quadra"
        description={`Tem certeza que deseja excluir a quadra "${deleteTarget?.code}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
