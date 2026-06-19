import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pencil, Grid3x3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getCemetery(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/cemeteries/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheCemiterioPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const cemetery = await getCemetery(id, session?.accessToken ?? '');

  if (!cemetery) notFound();

  const createdAt = new Date(cemetery.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={cemetery.name}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Cemitérios', href: '/cemiterios' },
          { label: cemetery.name },
        ]}
        action={
          <Link
            href={`/cemiterios/${id}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Pencil size={15} />
            Editar
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Informações gerais</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Status</dt>
              <dd className="mt-1"><StatusBadge status={cemetery.status} /></dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Cadastrado em</dt>
              <dd className="mt-1 text-sm text-neutral-900">{createdAt}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Endereço</dt>
              <dd className="mt-1 text-sm text-neutral-900">{cemetery.address}</dd>
            </div>
            {cemetery.neighborhood && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Bairro</dt>
                <dd className="mt-1 text-sm text-neutral-900">{cemetery.neighborhood}</dd>
              </div>
            )}
            {cemetery.areaM2 != null && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Área</dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {Number(cemetery.areaM2).toLocaleString('pt-BR')} m²
                </dd>
              </div>
            )}
            {cemetery.capacity != null && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Capacidade</dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {cemetery.capacity.toLocaleString('pt-BR')} jazigos
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Quadras</h2>
          {cemetery.blocks?.length === 0 ? (
            <div className="text-center py-6">
              <Grid3x3 size={28} className="mx-auto text-neutral-300 mb-2" />
              <p className="text-xs text-neutral-500">Nenhuma quadra cadastrada</p>
              <Link
                href={`/quadras/nova?cemiterioId=${id}`}
                className="mt-3 inline-block text-xs text-primary-600 hover:underline"
              >
                Adicionar quadra
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {cemetery.blocks?.map((q: any) => (
                <li key={q.id}>
                  <Link
                    href={`/quadras/${q.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-900">{q.code}</span>
                    <StatusBadge status={q.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
