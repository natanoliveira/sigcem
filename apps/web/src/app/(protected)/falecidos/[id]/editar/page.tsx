import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { DeceasedForm } from '@/components/deceased/deceased-form';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getDeceased(id: string, token: string) {
  const res = await fetch(`${API_URL}/api/v1/deceased/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarFalecidoPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions) as { accessToken?: string } | null;
  const deceased = await getDeceased(id, session?.accessToken ?? '');

  if (!deceased) notFound();

  function toInputDate(iso: string) {
    return iso ? new Date(iso).toISOString().split('T')[0] : '';
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar registro"
        description={deceased.fullName}
        breadcrumbs={[
          { label: 'Cadastros' },
          { label: 'Falecidos', href: '/falecidos' },
          { label: deceased.fullName, href: `/falecidos/${id}` },
          { label: 'Editar' },
        ]}
      />
      <DeceasedForm
        mode="edit"
        initialData={{
          id: deceased.id,
          fullName: deceased.fullName,
          birthDate: toInputDate(deceased.birthDate),
          deathDate: toInputDate(deceased.deathDate),
          cpf: deceased.cpf ?? '',
          causeOfDeath: deceased.causeOfDeath ?? '',
          birthPlace: deceased.birthPlace ?? '',
          nationality: deceased.nationality ?? '',
          fatherName: deceased.fatherName ?? '',
          motherName: deceased.motherName ?? '',
          notes: deceased.notes ?? '',
        }}
      />
    </div>
  );
}
