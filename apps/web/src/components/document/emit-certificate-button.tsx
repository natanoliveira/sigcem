'use client';

import { useState, useTransition } from 'react';
import { FileCheck, Download } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface EmitCertificateButtonProps {
  burialId: string;
  onEmitted?: () => void;
}

export function EmitCertificateButton({ burialId, onEmitted }: EmitCertificateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ url: string; numeroRegistro: string } | null>(null);
  const [error, setError] = useState('');

  function handleEmit() {
    setError('');
    startTransition(async () => {
      try {
        const data = await api.post('/api/v1/documents/certidao', { burialId });
        setResult({ url: data.url, numeroRegistro: data.numeroRegistro });
        toast.success('Certidão emitida com sucesso.');
        onEmitted?.();
      } catch (err: any) {
        const msg = err.message ?? 'Erro ao emitir certidão';
        setError(msg);
        toast.error(msg);
      }
    });
  }

  if (result) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <FileCheck size={16} className="text-green-600 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">
            Certidão emitida — Nº {result.numeroRegistro}
          </p>
          <p className="text-xs text-green-600">Link válido por 1 hora</p>
        </div>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          <Download size={13} />
          Baixar PDF
        </a>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleEmit}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {isPending ? <Spinner className="mr-1" /> : <FileCheck size={15} />}
        {isPending ? 'Gerando certidão...' : 'Emitir certidão de sepultamento'}
      </button>
    </div>
  );
}
