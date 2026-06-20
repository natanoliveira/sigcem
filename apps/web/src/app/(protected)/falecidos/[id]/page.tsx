'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Pencil, Lock, Shovel } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const SENSITIVE_ROLES = ['ADMIN', 'MANAGER'];

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  INHUMATION: { label: 'Inumação', className: 'bg-blue-500/10 text-blue-600 ring-blue-500/20' },
  EXHUMATION: { label: 'Exumação', className: 'bg-amber-500/10 text-amber-600 ring-amber-500/20' },
  TRANSFER:   { label: 'Translado', className: 'bg-violet-500/10 text-violet-600 ring-violet-500/20' },
};

function fmt(iso: string, long = false) {
  return new Date(iso).toLocaleDateString('pt-BR', long
    ? { day: '2-digit', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Deceased {
  id: string; fullName: string; birthDate: string; deathDate: string;
  cpf?: string | null; causeOfDeath?: string | null;
  birthPlace?: string | null; nationality?: string | null;
  fatherName?: string | null; motherName?: string | null;
  notes?: string | null; createdAt: string;
}

interface Burial {
  id: string; type: string; eventDate: string; authorizedBy: string;
  funeralHome: string | null;
  grave: { id: string; code: string; block: { code: string; cemetery: { name: string } } };
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

export default function DetalheDeceasedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession() as { data: any };
  const canSeeSensitive = (session?.roles ?? []).some((r: string) => SENSITIVE_ROLES.includes(r));

  const [deceased, setDeceased] = useState<Deceased | null>(null);
  const [burials, setBurials] = useState<Burial[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deceasedData, burialsData] = await Promise.all([
        api.get(`/api/v1/deceased/${id}`),
        api.get(`/api/v1/burials?deceasedId=${id}&limit=100`).catch(() => ({ data: [] })),
      ]);
      setDeceased(deceasedData);
      setBurials(burialsData.data ?? []);
    } catch {
      router.replace('/falecidos');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !deceased) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="bg-card rounded-xl border border-border p-6 h-56 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={deceased.fullName}
        breadcrumbs={[
          { label: 'Cadastros' },
          { label: 'Falecidos', href: '/falecidos' },
          { label: deceased.fullName },
        ]}
        action={
          <Link href={`/falecidos/${id}/editar`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Pencil size={13} />Editar
          </Link>
        }
      />

      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Dados pessoais</TabsTrigger>
          <TabsTrigger value="burials">Sepultamentos ({burials.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4 space-y-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Data de nascimento" value={fmt(deceased.birthDate, true)} />
              <Field label="Data de falecimento" value={fmt(deceased.deathDate, true)} />
              <Field label="Naturalidade" value={deceased.birthPlace} />
              <Field label="Nacionalidade" value={deceased.nationality} />
              <Field label="Nome do pai" value={deceased.fatherName} />
              <Field label="Nome da mãe" value={deceased.motherName} />
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cadastrado em</dt>
                <dd className="mt-1 text-[13px] text-foreground">{fmt(deceased.createdAt, true)}</dd>
              </div>
              {deceased.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Observações</dt>
                  <dd className="mt-1 text-[13px] text-muted-foreground">{deceased.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {canSeeSensitive ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-[11px] font-[700] uppercase tracking-wider text-amber-700">Dados sensíveis</p>
                <span className="text-[10px] font-[600] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ring-1 ring-amber-200">LGPD</span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-amber-700/70">CPF</dt>
                  <dd className="mt-1 text-[13px] font-mono text-foreground">{deceased.cpf ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-amber-700/70">Causa mortis</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{deceased.causeOfDeath ?? '—'}</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] text-amber-600">Este acesso foi registrado no log de auditoria.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-xl bg-muted px-5 py-4 text-[12px] text-muted-foreground">
              <Lock size={13} className="shrink-0" />
              CPF e causa mortis são restritos ao perfil Gestor/Administrador.
            </div>
          )}
        </TabsContent>

        <TabsContent value="burials" className="mt-4">
          <div className="bg-card rounded-xl border border-border">
            {burials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Shovel size={28} className="text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground">Nenhum sepultamento registrado para este falecido</p>
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Tipo', 'Data', 'Jazigo', 'Cemitério', 'Funerária'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {burials.map((b) => {
                    const cfg = TIPO_CONFIG[b.type] ?? { label: b.type, className: 'bg-muted text-muted-foreground' };
                    return (
                      <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-[600] ring-1 ring-inset', cfg.className)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmt(b.eventDate)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/jazigos/${b.grave.id}`} className="font-mono text-primary hover:underline">{b.grave.code}</Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-[12px]">{b.grave.block.cemetery.name}</td>
                        <td className="px-4 py-3 text-muted-foreground/70 text-[12px]">{b.funeralHome ?? '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/sepultamentos/${b.id}`} className="text-[12px] text-primary hover:underline">Ver</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
