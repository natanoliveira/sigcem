import { PageHeader } from '@/components/ui/page-header';
import { CemeteryForm } from '@/components/cemetery/cemetery-form';

export default function NovoCemiterioPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo cemitério"
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Cemitérios', href: '/cemiterios' },
          { label: 'Novo' },
        ]}
      />
      <CemeteryForm mode="create" />
    </div>
  );
}
