'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, Eye, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

const TIPO_LABEL: Record<string, string> = {
  SINGLE: 'Simples',
  DOUBLE: 'Duplo',
  DRAWER: 'Gaveta',
  OSSUARY: 'Ossário',
  PERPETUAL: 'Perpétuo',
};

interface Jazigo {
  id: string;
  code: string;
  type: string;
  status: string;
  locationRef: string | null;
  block: {
    id: string;
    code: string;
    cemetery: { id: string; name: string };
  };
}

interface ApiResponse {
  data: Jazigo[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function JazigosPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Jazigo | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/v1/graves/${deleteTarget.id}`);
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
        title="Jazigos"
        description="Unidades de sepultamento cadastradas"
        breadcrumbs={[{ label: 'Estrutura' }, { label: 'Jazigos' }]}
        action={
          <Link
            href="/jazigos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            Novo jazigo
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por código ou localização..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="AVAILABLE">Disponível</option>
            <option value="OCCUPIED">Ocupado</option>
            <option value="RESERVED">Reservado</option>
            <option value="BLOCKED">Interditado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Localização</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Quadra</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Cemitério</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
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
                      icon={MapPin}
                      title={search || statusFilter ? 'Nenhum jazigo encontrado com os filtros aplicados.' : 'Nenhum jazigo cadastrado.'}
                      description={!search && !statusFilter ? "Clique em 'Novo jazigo' para começar." : undefined}
                    />
                  </td>
                </tr>
              ) : (
                result?.data.map((j) => (
                  <tr key={j.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900">{j.code}</td>
                    <td className="px-4 py-3 text-neutral-600">{TIPO_LABEL[j.type] ?? j.type}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{j.locationRef ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quadras/${j.block.id}`} className="text-primary-600 hover:underline font-mono">
                        {j.block.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/cemiterios/${j.block.cemetery.id}`} className="text-neutral-600 hover:text-primary-600 hover:underline text-xs">
                        {j.block.cemetery.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/jazigos/${j.id}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                          title="Detalhes"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/jazigos/${j.id}/editar`}
                          className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(j)}
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
              {result.meta.total} jazigos — página {result.meta.page} de {result.meta.totalPages}
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
        title="Excluir jazigo"
        description={`Tem certeza que deseja excluir o jazigo "${deleteTarget?.code}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
