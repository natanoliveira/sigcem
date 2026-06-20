'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, RefreshCw, Pencil, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChangeStatusDialog } from '@/components/jazigo/change-status-dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

const TIPO_LABEL: Record<string, string> = {
  SINGLE: 'Simples', DOUBLE: 'Duplo', DRAWER: 'Gaveta',
  OSSUARY: 'Ossário', PERPETUAL: 'Perpétuo',
};

interface GraveHistory {
  id: string; previousStatus: string; newStatus: string;
  reason: string | null; createdAt: string;
}

interface Jazigo {
  id: string; code: string; type: string; status: string;
  locationRef: string | null; notes: string | null; createdAt: string;
  block: { id: string; code: string; cemetery: { id: string; name: string } };
  history: GraveHistory[];
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-foreground">{children}</dd>
    </div>
  );
}

interface JazigoDrawerProps {
  jazigoId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

export function JazigoDrawer({ jazigoId, open, onClose, onStatusChange }: JazigoDrawerProps) {
  const [jazigo, setJazigo] = useState<Jazigo | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!jazigoId || !open) return;
    setLoading(true);
    api.get(`/api/v1/graves/${jazigoId}`)
      .then(setJazigo)
      .catch(() => setJazigo(null))
      .finally(() => setLoading(false));
  }, [jazigoId, open]);

  function handleClose() {
    setJazigo(null);
    onClose();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0">
          <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SheetTitle className="text-[16px] font-[800]">
                  {loading ? '...' : jazigo ? `Jazigo ${jazigo.code}` : 'Jazigo'}
                </SheetTitle>
                {jazigo && (
                  <SheetDescription className="mt-0.5">
                    {jazigo.block.cemetery.name} — Quadra {jazigo.block.code}
                  </SheetDescription>
                )}
              </div>
              {jazigo && (
                <Link href={`/jazigos/${jazigo.id}`} onClick={handleClose}
                  className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Ver página completa">
                  <ExternalLink size={15} />
                </Link>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : jazigo ? (
              <>
                {/* Info */}
                <dl className="grid grid-cols-2 gap-4">
                  <Field label="Status"><StatusBadge status={jazigo.status} /></Field>
                  <Field label="Tipo">{TIPO_LABEL[jazigo.type] ?? jazigo.type}</Field>
                  <Field label="Quadra">
                    <Link href={`/quadras/${jazigo.block.id}`} onClick={handleClose}
                      className="text-primary hover:underline">
                      Quadra {jazigo.block.code}
                    </Link>
                  </Field>
                  <Field label="Cemitério">
                    <Link href={`/cemiterios/${jazigo.block.cemetery.id}`} onClick={handleClose}
                      className="text-primary hover:underline truncate block">
                      {jazigo.block.cemetery.name}
                    </Link>
                  </Field>
                  {jazigo.locationRef && (
                    <Field label="Localização">{jazigo.locationRef}</Field>
                  )}
                  {jazigo.notes && (
                    <div className="col-span-2">
                      <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Observações</dt>
                      <dd className="mt-0.5 text-[13px] text-muted-foreground">{jazigo.notes}</dd>
                    </div>
                  )}
                </dl>

                {/* Histórico recente */}
                {jazigo.history.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-[700] uppercase tracking-wider text-muted-foreground mb-3">
                      Histórico recente
                    </h3>
                    <div className="space-y-2">
                      {jazigo.history.slice(0, 5).map((h) => (
                        <div key={h.id} className="flex items-center gap-2 py-2 px-3 bg-muted/40 rounded">
                          <StatusBadge status={h.previousStatus} />
                          <ArrowRight size={11} className="text-muted-foreground shrink-0" />
                          <StatusBadge status={h.newStatus} />
                          <span className="text-[10px] text-muted-foreground ml-auto whitespace-nowrap">
                            {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground text-center py-10">Erro ao carregar jazigo.</p>
            )}
          </div>

          {jazigo && (
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <button onClick={() => setStatusOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-[600] border border-border rounded hover:bg-muted transition-colors">
                <RefreshCw size={13} />Alterar status
              </button>
              <Link href={`/jazigos/${jazigo.id}/editar`} onClick={handleClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-[600] text-white bg-primary rounded hover:bg-primary/90 transition-colors">
                <Pencil size={13} />Editar
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {jazigo && (
        <ChangeStatusDialog
          open={statusOpen}
          jazigoId={jazigo.id}
          currentStatus={jazigo.status as any}
          onClose={() => setStatusOpen(false)}
          onSuccess={() => {
            setStatusOpen(false);
            api.get(`/api/v1/graves/${jazigo.id}`).then(setJazigo).catch(() => {});
            onStatusChange?.();
          }}
        />
      )}
    </>
  );
}
