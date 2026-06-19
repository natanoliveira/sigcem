import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { CemeteryForm } from '@/components/cemetery/cemetery-form';

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

export default async function EditarCemiterioPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const cemetery = await getCemetery(id, session?.accessToken ?? '');

  if (!cemetery) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar cemitério"
        description={cemetery.name}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Cemitérios', href: '/cemiterios' },
          { label: cemetery.name, href: `/cemiterios/${id}` },
          { label: 'Editar' },
        ]}
      />
      <CemeteryForm
        mode="edit"
        initialData={{
          id: cemetery.id,
          name: cemetery.name,
          address: cemetery.address,
          neighborhood: cemetery.neighborhood ?? '',
          areaM2: cemetery.areaM2 != null ? String(cemetery.areaM2) : '',
          capacity: cemetery.capacity != null ? String(cemetery.capacity) : '',
        }}
      />
    </div>
  );
}
