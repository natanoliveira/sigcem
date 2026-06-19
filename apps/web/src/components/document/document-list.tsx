'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Download, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  issuedAt: string;
  issuedBy: string;
}

interface DocumentListProps {
  entidadeTipo: string;
  entidadeId: string;
  allowUpload?: boolean;
}

export function DocumentList({ entidadeTipo, entidadeId, allowUpload = true }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [inativarTarget, setInativarTarget] = useState<Document | null>(null);
  const [inativando, setInativando] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(
        `/api/v1/documents?entityType=${entidadeTipo}&entityId=${entidadeId}&limit=50`,
      );
      setDocuments(r.data ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [entidadeTipo, entidadeId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  async function handleDownload(doc: Document) {
    try {
      const { url } = await api.get(`/api/v1/documents/${doc.id}/download`);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao gerar link de download.');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Usar fetch diretamente pois api.ts só suporta JSON
      const { getSession } = await import('next-auth/react');
      const session = await getSession() as any;
      const res = await fetch(
        `/api/v1/documents/upload?entityType=${entidadeTipo}&entityId=${entidadeId}&type=ATTACHMENT`,
        {
          method: 'POST',
          headers: session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {},
          body: formData,
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message);
      }
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message ?? 'Erro no upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleInativar() {
    if (!inativarTarget) return;
    setInativando(true);
    try {
      await api.patch(`/api/v1/documents/${inativarTarget.id}/inativar`, {});
      setInativarTarget(null);
      fetchDocuments();
    } catch {
    } finally {
      setInativando(false);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-neutral-400 text-center py-4">Nenhum documento anexado.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <FileText size={16} className="text-neutral-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{doc.fileName}</p>
                <p className="text-xs text-neutral-500">
                  {TIPO_LABEL[doc.type] ?? doc.type} ·{' '}
                  {new Date(doc.issuedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
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
            </li>
          ))}
        </ul>
      )}

      {allowUpload && (
        <div>
          {uploadError && (
            <p className="text-xs text-red-600 mb-2">{uploadError}</p>
          )}
          <label className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${
            uploading
              ? 'text-neutral-400 border-neutral-200 bg-neutral-50'
              : 'text-primary-700 border-primary-200 bg-primary-50 hover:bg-primary-100'
          }`}>
            <Upload size={13} />
            {uploading ? 'Enviando...' : 'Anexar arquivo'}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          <span className="ml-2 text-xs text-neutral-400">PDF, JPEG ou PNG · máx. 10 MB</span>
        </div>
      )}

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
