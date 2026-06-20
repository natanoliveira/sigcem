'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  INHUMATION: { label: 'Inumação', className: 'bg-blue-500/10 text-blue-600 ring-blue-500/20' },
  EXHUMATION: { label: 'Exumação', className: 'bg-amber-500/10 text-amber-600 ring-amber-500/20' },
  TRANSFER:   { label: 'Translado', className: 'bg-violet-500/10 text-violet-600 ring-violet-500/20' },
};

interface Burial {
  id: string;
  type: string;
  eventDate: string;
  authorizedBy: string;
  funeralHome: string | null;
  notes: string | null;
  createdAt: string;
  deceased: { id: string; fullName: string };
  grave: { id: string; code: string; block: { id: string; code: string; cemetery: { id: string; name: string } } };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

interface BurialDrawerProps {
  burialId: string | null;
  open: boolean;
  onClose: () => void;
}

export function BurialDrawer({ burialId, open, onClose }: BurialDrawerProps) {
  const [burial, setBurial] = useState<Burial | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!burialId || !open) return;
    setLoading(true);
    api.get(`/api/v1/burials/${burialId}`)
      .then(setBurial)
      .catch(() => setBurial(null))
      .finally(() => setLoading(false));
  }, [burialId, open]);

  function handleClose() { setBurial(null); onClose(); }

  const typeCfg = burial ? (TIPO_CONFIG[burial.type] ?? { label: burial.type, className: 'bg-muted text-muted-foreground' }) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-[16px] font-[800]">
                {loading ? '...' : burial ? burial.deceased.fullName : 'Sepultamento'}
              </SheetTitle>
              {burial && typeCfg && (
                <SheetDescription className="mt-1 flex items-center gap-2">
                  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-[600] ring-1 ring-inset', typeCfg.className)}>
                    {typeCfg.label}
                  </span>
                  <span>·</span>
                  <span>{fmt(burial.eventDate)}</span>
                </SheetDescription>
              )}
            </div>
            {burial && (
              <Link href={`/sepultamentos/${burial.id}`} onClick={handleClose}
                className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Ver página completa">
                <ExternalLink size={15} />
              </Link>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : burial ? (
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Falecido</dt>
                <dd className="mt-0.5">
                  <Link href={`/falecidos/${burial.deceased.id}`} onClick={handleClose}
                    className="text-[13px] text-primary hover:underline font-[600]">
                    {burial.deceased.fullName}
                  </Link>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Jazigo</dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  <Link href={`/jazigos/${burial.grave.id}`} onClick={handleClose}
                    className="text-[13px] font-mono text-primary hover:underline">
                    {burial.grave.code}
                  </Link>
                  <span className="text-[12px] text-muted-foreground">
                    — Quadra {burial.grave.block.code}, {burial.grave.block.cemetery.name}
                  </span>
                </dd>
              </div>
              <Field label="Data do evento" value={fmt(burial.eventDate)} />
              <Field label="Autorizado por" value={burial.authorizedBy} />
              <Field label="Funerária" value={burial.funeralHome} />
              {burial.notes && (
                <div className="col-span-2">
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Observações</dt>
                  <dd className="mt-0.5 text-[13px] text-muted-foreground">{burial.notes}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-[13px] text-muted-foreground text-center py-10">Erro ao carregar registro.</p>
          )}
        </div>

        {burial && (
          <div className="px-5 py-4 border-t border-border">
            <Link href={`/sepultamentos/${burial.id}`} onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
              Ver detalhes completos
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
