'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  INHUMATION: { label: 'Inumação', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  EXHUMATION: { label: 'Exumação', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  TRANSFER: { label: 'Translado', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
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

export default function SepultamentosPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sepultamentos"
        description="Inumações, exumações e translados registrados"
        breadcrumbs={[{ label: 'Operação' }, { label: 'Sepultamentos' }]}
        action={
          <Link
            href="/sepultamentos/novo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            Novo registro
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-100">
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            <option value="INHUMATION">Inumação</option>
            <option value="EXHUMATION">Exumação</option>
            <option value="TRANSFER">Translado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Falecido</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Jazigo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Funerária</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">
                    Nenhum sepultamento registrado.
                  </td>
                </tr>
              ) : (
                result?.data.map((b) => {
                  const cfg = TIPO_CONFIG[b.type];
                  return (
                    <tr key={b.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/falecidos/${b.deceased.id}`} className="font-medium text-neutral-900 hover:text-primary-600 hover:underline">
                          {b.deceased.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/jazigos/${b.grave.id}`} className="font-mono text-primary-600 hover:underline">
                          {b.grave.code}
                        </Link>
                        <span className="text-xs text-neutral-400 ml-1">
                          — {b.grave.block.cemetery.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{formatDate(b.eventDate)}</td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{b.funeralHome ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sepultamentos/${b.id}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 inline-flex"
                        >
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {result && result.meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-600">
            <span>{result.meta.total} registros — página {result.meta.page} de {result.meta.totalPages}</span>
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
    </div>
  );
}
