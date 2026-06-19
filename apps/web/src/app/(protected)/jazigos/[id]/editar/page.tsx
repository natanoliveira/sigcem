import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { JazigoForm } from '@/components/jazigo/jazigo-form';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getJazigo(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/jazigos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarJazigoPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const jazigo = await getJazigo(id, session?.accessToken ?? '');

  if (!jazigo) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar jazigo"
        description={`${jazigo.codigo} — Quadra ${jazigo.quadra.codigo}`}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Jazigos', href: '/jazigos' },
          { label: jazigo.codigo, href: `/jazigos/${id}` },
          { label: 'Editar' },
        ]}
      />
      <JazigoForm
        mode="edit"
        initialData={{
          id: jazigo.id,
          quadraId: jazigo.quadraId,
          codigo: jazigo.codigo,
          tipo: jazigo.tipo,
          localizacaoRef: jazigo.localizacaoRef ?? '',
          observacoes: jazigo.observacoes ?? '',
        }}
      />
    </div>
  );
}
