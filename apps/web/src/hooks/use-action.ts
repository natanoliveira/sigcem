'use client';
import { useState, useTransition } from 'react';

export function useAction() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e: any) {
        setError(e?.message ?? 'Ocorreu um erro inesperado.');
      }
    });
  }

  return { isPending, error, setError, run };
}
