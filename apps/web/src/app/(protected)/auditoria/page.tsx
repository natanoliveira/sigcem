'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const ACAO_CONFIG: Record<string, { label: string; className: string }> = {
  create:         { label: 'Criação',    className: 'bg-green-50 text-green-700 ring-green-600/20' },
  update:         { label: 'Edição',     className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  delete:         { label: 'Exclusão',   className: 'bg-red-50 text-red-700 ring-red-600/20' },
  view_sensitive: { label: 'Dado LGPD', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
};

const ENTIDADE_OPTIONS = [
  'Cemetery', 'Quadra', 'Jazigo', 'Deceased', 'Burial', 'Document',
];

interface AuditLog {
  id: string;
  usuarioId: string;
  acao: string;
  entidadeTipo: string;
  entidadeId: string;
  dadosAnteriores: Record<string, unknown> | null;
  dadosNovos: Record<string, unknown> | null;
  ip: string | null;
  criadoEm: string;
}

interface ApiResponse {
  data: AuditLog[];
  meta: { total: number; page: number; totalPages: number; limit: number };
}

function DiffView({ antes, depois }: { antes: Record<string, unknown> | null; depois: Record<string, unknown> | null }) {
  if (!antes && !depois) return null;
  const keys = Array.from(new Set([...Object.keys(antes ?? {}), ...Object.keys(depois ?? {})]));

  return (
    <div className="mt-3 text-xs rounded-lg border border-neutral-100 overflow-hidden">
      {keys.map((k) => {
        const prev = antes?.[k];
        const next = depois?.[k];
        const changed = JSON.stringify(prev) !== JSON.stringify(next);
        return (
          <div key={k} className={`flex gap-2 px-3 py-1.5 border-b border-neutral-50 last:border-0 ${changed ? 'bg-amber-50' : ''}`}>
            <span className="text-neutral-400 w-32 shrink-0 truncate">{k}</span>
            {antes && <span className="text-red-500 line-through truncate flex-1">{prev !== undefined ? JSON.stringify(prev) : '—'}</span>}
            {depois && <span className="text-green-700 truncate flex-1">{next !== undefined ? JSON.stringify(next) : '—'}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditoriaPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    entidadeTipo: '',
    acao: '',
    dataInicio: '',
    dataFim: '',
  });
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filters.entidadeTipo) params.set('entidadeTipo', filters.entidadeTipo);
      if (filters.acao) params.set('acao', filters.acao);
      if (filters.dataInicio) params.set('dataInicio', filters.dataInicio);
      if (filters.dataFim) params.set('dataFim', filters.dataFim);
      const data = await api.get(`/api/v1/audit-logs?${params}`);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function setFilter(key: string, value: string) {
    setFilters((p) => ({ ...p, [key]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Registro de todas as operações realizadas no sistema"
        breadcrumbs={[{ label: 'Gestão' }, { label: 'Auditoria' }]}
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap gap-3">
        <select
          value={filters.entidadeTipo}
          onChange={(e) => setFilter('entidadeTipo', e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Todos os módulos</option>
          {ENTIDADE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          value={filters.acao}
          onChange={(e) => setFilter('acao', e.target.value)}
          className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Todas as ações</option>
          {Object.entries(ACAO_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilter('dataInicio', e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <span className="text-neutral-400 text-sm">até</span>
          <input
            type="date"
            value={filters.dataFim}
            onChange={(e) => setFilter('dataFim', e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {(filters.entidadeTipo || filters.acao || filters.dataInicio || filters.dataFim) && (
          <button
            onClick={() => { setFilters({ entidadeTipo: '', acao: '', dataInicio: '', dataFim: '' }); setPage(1); }}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Logs */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-white rounded-xl border border-neutral-200 animate-pulse" />
          ))
        ) : result?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 px-4 py-12 text-center text-sm text-neutral-500">
            Nenhum log encontrado com os filtros aplicados.
          </div>
        ) : (
          result?.data.map((log) => {
            const cfg = ACAO_CONFIG[log.acao] ?? { label: log.acao, className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20' };
            const isExpanded = expanded === log.id;
            const hasDetail = log.dadosAnteriores || log.dadosNovos;
            const date = new Date(log.criadoEm).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
            });

            return (
              <div key={log.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <button
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 ${hasDetail ? 'hover:bg-neutral-50 cursor-pointer' : 'cursor-default'}`}
                  onClick={() => hasDetail && setExpanded(isExpanded ? null : log.id)}
                >
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset shrink-0 ${cfg.className}`}>
                    {cfg.label}
                  </span>
                  <span className="text-sm font-medium text-neutral-700 shrink-0">{log.entidadeTipo}</span>
                  <span className="text-xs text-neutral-400 font-mono truncate flex-1">{log.entidadeId}</span>
                  <span className="text-xs text-neutral-400 shrink-0">{date}</span>
                  {hasDetail && (
                    <span className="text-xs text-neutral-400 shrink-0">{isExpanded ? '▲' : '▼'}</span>
                  )}
                </button>

                {isExpanded && hasDetail && (
                  <div className="px-4 pb-4 border-t border-neutral-50">
                    <div className="flex gap-2 mt-2 text-xs text-neutral-400">
                      <span>Usuário: <span className="font-mono text-neutral-600">{log.usuarioId.slice(0, 8)}</span></span>
                      {log.ip && <span>· IP: {log.ip}</span>}
                    </div>
                    <DiffView antes={log.dadosAnteriores} depois={log.dadosNovos} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {result && result.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-600">
          <span>{result.meta.total} eventos — página {result.meta.page} de {result.meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40">
              Anterior
            </button>
            <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page === result.meta.totalPages}
              className="px-3 py-1 border border-neutral-300 rounded hover:bg-neutral-50 disabled:opacity-40">
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
