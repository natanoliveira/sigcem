import { PageHeader } from '@/components/ui/page-header';
import { QuadraForm } from '@/components/quadra/quadra-form';

interface Props {
  searchParams: Promise<{ cemiterioId?: string }>;
}

export default async function NovaQuadraPage({ searchParams }: Props) {
  const { cemiterioId } = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova quadra"
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Quadras', href: '/quadras' },
          { label: 'Nova' },
        ]}
      />
      <QuadraForm mode="create" fixedCemiterioId={cemiterioId} />
    </div>
  );
}
