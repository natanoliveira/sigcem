import { PageHeader } from '@/components/ui/page-header';
import { JazigoForm } from '@/components/jazigo/jazigo-form';

interface Props {
  searchParams: Promise<{ quadraId?: string }>;
}

export default async function NovoJazigoPage({ searchParams }: Props) {
  const { quadraId } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo jazigo"
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Jazigos', href: '/jazigos' },
          { label: 'Novo' },
        ]}
      />
      <JazigoForm mode="create" fixedQuadraId={quadraId} />
    </div>
  );
}
