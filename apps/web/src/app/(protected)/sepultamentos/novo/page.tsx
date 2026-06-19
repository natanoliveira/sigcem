import { PageHeader } from '@/components/ui/page-header';
import { BurialWizard } from '@/components/burial/burial-wizard';

export default function NovoSepultamentoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo registro de sepultamento"
        description="Inumação, exumação ou translado"
        breadcrumbs={[
          { label: 'Operação' },
          { label: 'Sepultamentos', href: '/sepultamentos' },
          { label: 'Novo' },
        ]}
      />
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <BurialWizard />
      </div>
    </div>
  );
}
