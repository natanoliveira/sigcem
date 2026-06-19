'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChangeStatusDialog } from '@/components/jazigo/change-status-dialog';

const TIPO_LABEL: Record<string, string> = {
  SIMPLES: 'Simples',
  DUPLO: 'Duplo',
  GAVETA: 'Gaveta',
  OSSUARIO: 'Ossário',
  PERPETUO: 'Perpétuo',
};

interface JazigoHistorico {
  id: string;
  statusAnterior: string;
  statusNovo: string;
  motivo: string | null;
  usuarioId: string;
  criadoEm: string;
}

interface Jazigo {
  id: string;
  codigo: string;
  tipo: string;
  status: string;
  localizacaoRef: string | null;
  observacoes: string | null;
  criadoEm: string;
  quadra: { id: string; codigo: string; cemiterio: { id: string; nome: string } };
  historico: JazigoHistorico[];
}

export default function DetalheJazigoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [jazigo, setJazigo] = useState<Jazigo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const fetchJazigo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/jazigos/${id}`);
      setJazigo(data);
    } catch {
      router.replace('/jazigos');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchJazigo(); }, [fetchJazigo]);

  if (loading || !jazigo) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const criadoEm = new Date(jazigo.criadoEm).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Jazigo ${jazigo.codigo}`}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Jazigos', href: '/jazigos' },
          { label: jazigo.codigo },
        ]}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setStatusDialogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <RefreshCw size={15} />
              Alterar status
            </button>
            <Link
              href={`/jazigos/${id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <Pencil size={15} />
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Informações</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Status</dt>
              <dd className="mt-1"><StatusBadge status={jazigo.status} /></dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Tipo</dt>
              <dd className="mt-1 text-sm text-neutral-900">{TIPO_LABEL[jazigo.tipo] ?? jazigo.tipo}</dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Quadra</dt>
              <dd className="mt-1">
                <Link href={`/quadras/${jazigo.quadra.id}`} className="text-sm text-primary-600 hover:underline">
                  Quadra {jazigo.quadra.codigo}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Cemitério</dt>
              <dd className="mt-1">
                <Link href={`/cemiterios/${jazigo.quadra.cemiterio.id}`} className="text-sm text-primary-600 hover:underline">
                  {jazigo.quadra.cemiterio.nome}
                </Link>
              </dd>
            </div>
            {jazigo.localizacaoRef && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Localização</dt>
                <dd className="mt-1 text-sm text-neutral-900">{jazigo.localizacaoRef}</dd>
              </div>
            )}
            {jazigo.observacoes && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Observações</dt>
                <dd className="mt-1 text-sm text-neutral-600">{jazigo.observacoes}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Cadastrado em</dt>
              <dd className="mt-1 text-sm text-neutral-900">{criadoEm}</dd>
            </div>
          </dl>
        </div>

        {/* Histórico de status — T-021 */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Histórico de status</h2>

          {jazigo.historico.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              Nenhuma alteração de status registrada.
            </p>
          ) : (
            <div className="space-y-3">
              {jazigo.historico.map((h) => {
                const data = new Date(h.criadoEm).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                });
                return (
                  <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <StatusBadge status={h.statusAnterior} />
                      <ArrowRight size={13} className="text-neutral-400 shrink-0" />
                      <StatusBadge status={h.statusNovo} />
                      {h.motivo && (
                        <span className="text-xs text-neutral-500 truncate ml-1">— {h.motivo}</span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-400 shrink-0 whitespace-nowrap">{data}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChangeStatusDialog
        open={statusDialogOpen}
        jazigoId={jazigo.id}
        currentStatus={jazigo.status as any}
        onClose={() => setStatusDialogOpen(false)}
        onSuccess={fetchJazigo}
      />
    </div>
  );
}
