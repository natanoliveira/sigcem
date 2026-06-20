import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { DocumentList } from '@/components/document/document-list';
import { EmitCertificateButton } from '@/components/document/emit-certificate-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  INHUMATION: { label: 'Inumação', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  EXHUMATION: { label: 'Exumação', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  TRANSFER: { label: 'Translado', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
};

const GRAVE_TYPE_LABEL: Record<string, string> = {
  SINGLE: 'Simples',
  DOUBLE: 'Duplo',
  DRAWER: 'Gaveta',
  OSSUARY: 'Ossário',
  PERPETUAL: 'Perpétuo',
};

async function getBurial(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/burials/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
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

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheSepultamentoPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const burial = await getBurial(id, session?.accessToken ?? '');

  if (!burial) notFound();

  const cfg = TIPO_CONFIG[burial.type] ?? TIPO_CONFIG.INHUMATION;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhes do registro"
        breadcrumbs={[
          { label: 'Operação' },
          { label: 'Sepultamentos', href: '/sepultamentos' },
          { label: burial.deceased.fullName },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className={`inline-flex items-center rounded-md px-3 py-1 text-sm font-semibold ring-1 ring-inset ${cfg.className}`}>
              {cfg.label}
            </span>
            <span className="text-sm text-neutral-500">{formatDate(burial.eventDate)}</span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Falecido</dt>
              <dd className="mt-1">
                <Link href={`/falecidos/${burial.deceased.id}`} className="text-sm font-medium text-primary-600 hover:underline">
                  {burial.deceased.fullName}
                </Link>
                <span className="text-xs text-neutral-500 ml-2">
                  Falecido em {formatDate(burial.deceased.deathDate)}
                </span>
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Jazigo</dt>
              <dd className="mt-1">
                <Link href={`/jazigos/${burial.grave.id}`} className="text-sm font-mono font-medium text-primary-600 hover:underline">
                  {burial.grave.code}
                </Link>
                <span className="text-xs text-neutral-500 ml-2">
                  — {burial.grave.block.cemetery.name}, Quadra {burial.grave.block.code}
                </span>
              </dd>
            </div>

            <Field label="Autorizado por" value={burial.authorizedBy} />
            <Field label="Funerária" value={burial.funeralHome} />
            <Field label="Responsável familiar" value={burial.responsibleName} />
            {burial.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Observações</dt>
                <dd className="mt-1 text-sm text-neutral-600">{burial.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Jazigo após operação</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Código</span>
                <Link href={`/jazigos/${burial.grave.id}`} className="font-mono text-primary-600 hover:underline">
                  {burial.grave.code}
                </Link>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Status atual</span>
                <StatusBadge status={burial.grave.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tipo</span>
                <span className="text-neutral-700">{GRAVE_TYPE_LABEL[burial.grave.type] ?? burial.grave.type}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <p className="text-xs text-neutral-500 mb-3">
              Registrado em {formatDate(burial.createdAt)}
            </p>
            {/* T-040 — emissão de certidão */}
            {burial.type === 'INHUMATION' && (
              <EmitCertificateButton burialId={burial.id} />
            )}
          </div>

          {/* T-038 — documentos vinculados */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Documentos</h2>
            <DocumentList entidadeTipo="Burial" entidadeId={burial.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
