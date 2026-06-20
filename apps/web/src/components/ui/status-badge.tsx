import { cn } from '@/lib/utils';

const statusMap: Record<string, { label: string; className: string }> = {
  // EntityStatus
  ACTIVE: { label: 'Ativo', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  INACTIVE: { label: 'Inativo', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  // GraveStatus
  AVAILABLE: { label: 'Disponível', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  OCCUPIED: { label: 'Ocupado', className: 'bg-red-50 text-red-700 ring-red-600/20' },
  RESERVED: { label: 'Reservado', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  BLOCKED: { label: 'Interditado', className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] ?? {
    label: status,
    className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
  };

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
