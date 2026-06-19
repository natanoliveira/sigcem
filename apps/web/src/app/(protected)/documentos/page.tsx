'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

const TIPO_LABEL: Record<string, string> = {
  CERTIFICATE: 'Certidão',
  AUTHORIZATION: 'Autorização',
  PHOTO: 'Fotografia',
  ATTACHMENT: 'Anexo',
};

interface Document {
  id: string;
  type: string;
  fileName: string;
  entityType: string;
  entityId: string;
  issuedAt: string;
}

interface ApiResponse {
  data: Document[];
  meta: { total: number; page: number; totalPages: number; limit: number };
}

export default function DocumentosPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipoFilter, setTipoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [inativarTarget, setInativarTarget] = useState<Document | null>(null);
  const [inativando, setInativando] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (tipoFilter) params.set('type', tipoFilter);
      const data = await api.get(`/api/v1/documents?${params}`);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [page, tipoFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDownload(doc: Document) {
    try {
      const { url } = await api.get(`/api/v1/documents/${doc.id}/download`);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao gerar link.');
    }
  }

  async function handleInativar() {
    if (!inativarTarget) return;
    setInativando(true);
    try {
      await api.patch(`/api/v1/documents/${inativarTarget.id}/inativar`, {});
      setInativarTarget(null);
      fetchData();
    } catch {
    } finally {
      setInativando(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Certidões, autorizações e anexos do sistema"
        breadcrumbs={[{ label: 'Gestão' }, { label: 'Documentos' }]}
      />

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-4 border-b border-neutral-100">
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TIPO_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Arquivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Entidade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Emitido em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : result?.data.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={FileText}
                      title="Nenhum documento encontrado."
                      description={!tipoFilter ? 'Os documentos gerados pelo sistema aparecerão aqui.' : undefined}
                    />
                  </td>
                </tr>
              ) : (
                result?.data.map((doc) => (
                  <tr key={doc.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                        <FileText size={13} className="text-neutral-400" />
                        {TIPO_LABEL[doc.type] ?? doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-900 text-xs font-mono">{doc.fileName}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {doc.entityType} · {doc.entityId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 text-xs">
                      {new Date(doc.issuedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => setInativarTarget(doc)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          title="Remover"
                        >
                          <X size={15} />
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
            <span>{result.meta.total} documentos</span>
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

      <ConfirmDialog
        open={!!inativarTarget}
        title="Remover documento"
        description={`Tem certeza que deseja remover "${inativarTarget?.fileName}"?`}
        confirmLabel="Remover"
        onConfirm={handleInativar}
        onCancel={() => setInativarTarget(null)}
        loading={inativando}
      />
    </div>
  );
}
