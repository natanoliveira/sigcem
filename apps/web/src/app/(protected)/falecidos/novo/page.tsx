import { PageHeader } from '@/components/ui/page-header';
import { DeceasedForm } from '@/components/deceased/deceased-form';

export default function NovoFalecidoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar falecido"
        breadcrumbs={[
          { label: 'Cadastros' },
          { label: 'Falecidos', href: '/falecidos' },
          { label: 'Novo' },
        ]}
      />
      <DeceasedForm mode="create" />
    </div>
  );
}
