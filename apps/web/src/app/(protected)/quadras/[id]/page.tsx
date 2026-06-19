import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pencil, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const graveTypeLabel: Record<string, string> = {
  SINGLE: 'Simples',
  DOUBLE: 'Duplo',
  DRAWER: 'Gaveta',
  OSSUARY: 'Ossário',
  PERPETUAL: 'Perpétuo',
};

async function getQuadra(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/blocks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheQuadraPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const quadra = await getQuadra(id, session?.accessToken ?? '');

  if (!quadra) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quadra ${quadra.code}`}
        description={quadra.name ?? undefined}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Quadras', href: '/quadras' },
          { label: quadra.code },
        ]}
        action={
          <Link
            href={`/quadras/${id}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Pencil size={15} />
            Editar
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Informações</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Cemitério</dt>
              <dd className="mt-1">
                <Link href={`/cemiterios/${quadra.cemetery.id}`} className="text-sm text-primary-600 hover:underline">
                  {quadra.cemetery.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Status</dt>
              <dd className="mt-1"><StatusBadge status={quadra.status} /></dd>
            </div>
            {quadra.capacity != null && (
              <div>
                <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Capacidade</dt>
                <dd className="mt-1 text-sm text-neutral-900">
                  {quadra.capacity.toLocaleString('pt-BR')} jazigos
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Jazigos cadastrados</dt>
              <dd className="mt-1 text-sm text-neutral-900">{quadra.graves?.length ?? 0}</dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Jazigos</h2>
            <Link
              href={`/jazigos/novo?quadraId=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100"
            >
              <Plus size={13} />
              Novo jazigo
            </Link>
          </div>

          {quadra.graves?.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">Nenhum jazigo cadastrado nesta quadra.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Código</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="py-2 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {quadra.graves?.map((j: any) => (
                    <tr key={j.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                      <td className="py-2 px-3 font-mono font-semibold text-neutral-900">{j.code}</td>
                      <td className="py-2 px-3 text-neutral-600">{graveTypeLabel[j.type] ?? j.type}</td>
                      <td className="py-2 px-3">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link href={`/jazigos/${j.id}`} className="text-xs text-primary-600 hover:underline">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
