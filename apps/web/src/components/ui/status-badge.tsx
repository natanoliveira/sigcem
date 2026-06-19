import { cn } from '@/lib/utils';

type Status = 'ACTIVE' | 'INACTIVE' | string;

const statusMap: Record<string, { label: string; className: string }> = {
  ATIVO: { label: 'Ativo', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  INATIVO: { label: 'Inativo', className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20' },
  OCUPADO: { label: 'Ocupado', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  RESERVADO: { label: 'Reservado', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  MANUTENCAO: { label: 'Manutenção', className: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
