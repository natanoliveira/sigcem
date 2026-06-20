'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, RefreshCw, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChangeStatusDialog } from '@/components/jazigo/change-status-dialog';

const TIPO_LABEL: Record<string, string> = {
  SINGLE: 'Simples', DOUBLE: 'Duplo', DRAWER: 'Gaveta',
  OSSUARY: 'Ossário', PERPETUAL: 'Perpétuo',
};

interface GraveHistory {
  id: string; previousStatus: string; newStatus: string;
  reason: string | null; userId: string; createdAt: string;
}

interface Jazigo {
  id: string; code: string; type: string; status: string;
  locationRef: string | null; notes: string | null; createdAt: string;
  block: { id: string; code: string; cemetery: { id: string; name: string } };
  history: GraveHistory[];
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
      const data = await api.get(`/api/v1/graves/${id}`);
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
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="bg-card rounded-xl border border-border p-6 h-48 animate-pulse" />
      </div>
    );
  }

  const criadoEm = new Date(jazigo.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Jazigo ${jazigo.code}`}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Jazigos', href: '/jazigos' },
          { label: jazigo.code },
        ]}
        action={
          <div className="flex gap-2">
            <button onClick={() => setStatusDialogOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] border border-border rounded-lg hover:bg-muted transition-colors">
              <RefreshCw size={13} />Alterar status
            </button>
            <Link href={`/jazigos/${id}/editar`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
              <Pencil size={13} />Editar
            </Link>
          </div>
        }
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="history">Histórico ({jazigo.history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Status</dt>
                <dd className="mt-1"><StatusBadge status={jazigo.status} /></dd>
              </div>
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Tipo</dt>
                <dd className="mt-1 text-[13px] text-foreground">{TIPO_LABEL[jazigo.type] ?? jazigo.type}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Quadra</dt>
                <dd className="mt-1">
                  <Link href={`/quadras/${jazigo.block.id}`} className="text-[13px] text-primary hover:underline">
                    Quadra {jazigo.block.code}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cemitério</dt>
                <dd className="mt-1">
                  <Link href={`/cemiterios/${jazigo.block.cemetery.id}`} className="text-[13px] text-primary hover:underline">
                    {jazigo.block.cemetery.name}
                  </Link>
                </dd>
              </div>
              {jazigo.locationRef && (
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Localização</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{jazigo.locationRef}</dd>
                </div>
              )}
              {jazigo.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Observações</dt>
                  <dd className="mt-1 text-[13px] text-muted-foreground">{jazigo.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cadastrado em</dt>
                <dd className="mt-1 text-[13px] text-foreground">{criadoEm}</dd>
              </div>
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-6">
            {jazigo.history.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">
                Nenhuma alteração de status registrada.
              </p>
            ) : (
              <div className="space-y-2">
                {jazigo.history.map((h) => {
                  const data = new Date(h.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <div key={h.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <StatusBadge status={h.previousStatus} />
                        <ArrowRight size={11} className="text-muted-foreground shrink-0" />
                        <StatusBadge status={h.newStatus} />
                        {h.reason && (
                          <span className="text-[11px] text-muted-foreground truncate ml-1">— {h.reason}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0 whitespace-nowrap">{data}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
