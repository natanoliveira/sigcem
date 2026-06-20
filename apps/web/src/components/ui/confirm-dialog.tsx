'use client';

import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: ConfirmVariant;
}

const VARIANT_META: Record<ConfirmVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
}> = {
  danger: {
    icon: ShieldAlert,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    confirmClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
    confirmClass: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    confirmClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading,
  variant = 'danger',
}: ConfirmDialogProps) {
  const meta = VARIANT_META[variant];
  const Icon = meta.icon;

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('p-2.5 rounded-xl shrink-0', meta.iconBg)}>
              <Icon size={20} className={meta.iconColor} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <AlertDialogTitle className="text-[15px] font-[700] text-foreground leading-tight">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={loading}
            className="h-9 px-4 text-[13px]"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn('h-9 px-4 text-[13px] font-[600]', meta.confirmClass)}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Aguarde...
              </span>
            ) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
