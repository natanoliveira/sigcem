import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { QuadraForm } from '@/components/quadra/quadra-form';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

export default async function EditarQuadraPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const quadra = await getQuadra(id, session?.accessToken ?? '');

  if (!quadra) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar quadra"
        description={`${quadra.code}${quadra.name ? ` — ${quadra.name}` : ''}`}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Quadras', href: '/quadras' },
          { label: quadra.code, href: `/quadras/${id}` },
          { label: 'Editar' },
        ]}
      />
      <QuadraForm
        mode="edit"
        initialData={{
          id: quadra.id,
          cemeteryId: quadra.cemeteryId,
          code: quadra.code,
          name: quadra.name ?? '',
          capacity: quadra.capacity != null ? String(quadra.capacity) : '',
        }}
      />
    </div>
  );
}
