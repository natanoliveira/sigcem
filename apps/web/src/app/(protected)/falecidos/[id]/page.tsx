'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

const SENSITIVE_ROLES = ['ADMIN', 'MANAGER'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

interface Deceased {
  id: string;
  fullName: string;
  birthDate: string;
  deathDate: string;
  cpf?: string | null;
  causeOfDeath?: string | null;
  birthPlace?: string | null;
  nationality?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  notes?: string | null;
  createdAt: string;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">{label}</dt>
      <dd className="mt-1 text-sm text-neutral-900">{value}</dd>
    </div>
  );
}

export default function DetalheDeceasedPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession() as { data: any };
  const roles: string[] = session?.roles ?? [];
  const canSeeSensitive = roles.some((r: string) => SENSITIVE_ROLES.includes(r));

  const [deceased, setDeceased] = useState<Deceased | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeceased = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/deceased/${id}`);
      setDeceased(data);
    } catch {
      router.replace('/falecidos');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchDeceased(); }, [fetchDeceased]);

  if (loading || !deceased) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-neutral-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-6 h-64 animate-pulse" />
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
          <Link
            href={`/falecidos/${id}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Pencil size={15} />
            Editar
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Dados pessoais</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Data de nascimento" value={formatDate(deceased.birthDate)} />
            <Field label="Data de falecimento" value={formatDate(deceased.deathDate)} />
            <Field label="Naturalidade" value={deceased.birthPlace} />
            <Field label="Nacionalidade" value={deceased.nationality} />
            <Field label="Nome do pai" value={deceased.fatherName} />
            <Field label="Nome da mãe" value={deceased.motherName} />
            {deceased.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Observações</dt>
                <dd className="mt-1 text-sm text-neutral-600">{deceased.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-4">
          {/* Dados sensíveis LGPD */}
          {canSeeSensitive ? (
            <div className="bg-white rounded-xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">Dados sensíveis</h2>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                  LGPD
                </span>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">CPF</dt>
                  <dd className="mt-1 text-sm font-mono text-neutral-900">
                    {deceased.cpf ?? <span className="text-neutral-400 not-italic font-sans">Não informado</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Causa mortis</dt>
                  <dd className="mt-1 text-sm text-neutral-900">
                    {deceased.causeOfDeath ?? <span className="text-neutral-400">Não informada</span>}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-amber-600">
                Este acesso foi registrado no log de auditoria.
              </p>
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-5 text-center">
              <span className="text-2xl">🔒</span>
              <p className="text-xs text-neutral-500 mt-2">
                CPF e causa mortis são restritos ao perfil Gestor ou Administrador.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-xs text-neutral-500">
              Cadastrado em {formatDate(deceased.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
