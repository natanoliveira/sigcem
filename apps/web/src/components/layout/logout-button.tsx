'use client';

import { useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await signOut({ callbackUrl: '/login' });
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-900 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Sair do sistema"
      >
        <LogOut size={18} />
      </button>

      <ConfirmDialog
        open={open}
        title="Encerrar sessão"
        description="Tem certeza que deseja sair do sistema? Você precisará fazer login novamente."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={isPending}
        variant="warning"
      />
    </>
  );
}
