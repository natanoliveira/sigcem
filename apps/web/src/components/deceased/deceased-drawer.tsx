'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';

const SENSITIVE_ROLES = ['ADMIN', 'MANAGER'];

interface Deceased {
  id: string; fullName: string; birthDate: string; deathDate: string;
  cpf?: string | null; causeOfDeath?: string | null;
  birthPlace?: string | null; nationality?: string | null;
  fatherName?: string | null; motherName?: string | null;
  notes?: string | null; createdAt: string;
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

interface DeceasedDrawerProps {
  deceasedId: string | null;
  open: boolean;
  onClose: () => void;
}

export function DeceasedDrawer({ deceasedId, open, onClose }: DeceasedDrawerProps) {
  const { data: session } = useSession() as { data: any };
  const canSeeSensitive = (session?.roles ?? []).some((r: string) => SENSITIVE_ROLES.includes(r));
  const [deceased, setDeceased] = useState<Deceased | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deceasedId || !open) return;
    setLoading(true);
    api.get(`/api/v1/deceased/${deceasedId}`)
      .then(setDeceased)
      .catch(() => setDeceased(null))
      .finally(() => setLoading(false));
  }, [deceasedId, open]);

  function handleClose() { setDeceased(null); onClose(); }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-[16px] font-[800]">
                {loading ? '...' : deceased?.fullName ?? 'Falecido'}
              </SheetTitle>
              {deceased && (
                <SheetDescription className="mt-0.5">
                  Falecido em {fmt(deceased.deathDate)}
                </SheetDescription>
              )}
            </div>
            {deceased && (
              <Link href={`/falecidos/${deceased.id}`} onClick={handleClose}
                className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Ver página completa">
                <ExternalLink size={15} />
              </Link>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="h-2.5 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : deceased ? (
            <>
              <dl className="grid grid-cols-2 gap-4">
                <Field label="Data de nascimento" value={fmt(deceased.birthDate)} />
                <Field label="Data de falecimento" value={fmt(deceased.deathDate)} />
                <Field label="Naturalidade" value={deceased.birthPlace} />
                <Field label="Nacionalidade" value={deceased.nationality} />
                <Field label="Nome do pai" value={deceased.fatherName} />
                <Field label="Nome da mãe" value={deceased.motherName} />
                {deceased.notes && (
                  <div className="col-span-2">
                    <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Observações</dt>
                    <dd className="mt-0.5 text-[13px] text-muted-foreground">{deceased.notes}</dd>
                  </div>
                )}
              </dl>

              {canSeeSensitive ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                  <p className="text-[10px] font-[700] uppercase tracking-wider text-amber-700">Dados sensíveis — LGPD</p>
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">CPF</dt>
                      <dd className="mt-0.5 text-[13px] font-mono">{deceased.cpf ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">Causa mortis</dt>
                      <dd className="mt-0.5 text-[13px]">{deceased.causeOfDeath ?? '—'}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-lg bg-muted px-4 py-3 text-[12px] text-muted-foreground">
                  <Lock size={13} className="shrink-0" />
                  CPF e causa mortis são restritos ao perfil Gestor/Administrador.
                </div>
              )}
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground text-center py-10">Erro ao carregar registro.</p>
          )}
        </div>

        {deceased && (
          <div className="px-5 py-4 border-t border-border">
            <Link href={`/falecidos/${deceased.id}/editar`} onClick={handleClose}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
              <Pencil size={13} />Editar registro
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
