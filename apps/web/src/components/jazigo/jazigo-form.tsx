'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

const TIPO_OPTIONS = [
  { value: 'SINGLE', label: 'Simples' },
  { value: 'DOUBLE', label: 'Duplo' },
  { value: 'DRAWER', label: 'Gaveta' },
  { value: 'OSSUARY', label: 'Ossário' },
  { value: 'PERPETUAL', label: 'Perpétuo' },
];

interface Block {
  id: string;
  code: string;
  cemetery: { name: string };
}

interface GraveFormData {
  blockId: string;
  code: string;
  type: string;
  locationRef: string;
  notes: string;
}

interface JazigoFormProps {
  initialData?: Partial<GraveFormData> & { id?: string };
  mode: 'create' | 'edit';
  fixedQuadraId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function JazigoForm({ initialData, mode, fixedQuadraId, onSuccess, onCancel }: JazigoFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [form, setForm] = useState<GraveFormData>({
    blockId: fixedQuadraId ?? initialData?.blockId ?? '',
    code: initialData?.code ?? '',
    type: initialData?.type ?? '',
    locationRef: initialData?.locationRef ?? '',
    notes: initialData?.notes ?? '',
  });

  useEffect(() => {
    if (!fixedQuadraId && mode === 'create') {
      api.get('/api/v1/blocks?limit=200').then((r) => setBlocks(r.data ?? []));
    }
  }, [fixedQuadraId, mode]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const payload = {
      blockId: form.blockId,
      code: form.code.trim().toUpperCase(),
      type: form.type,
      locationRef: form.locationRef.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await api.post('/api/v1/graves', payload);
        } else {
          const { blockId: _, ...updatePayload } = payload;
          await api.patch(`/api/v1/graves/${initialData!.id}`, updatePayload);
        }
        toast.success('Jazigo salvo com sucesso.');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(fixedQuadraId ? `/quadras/${fixedQuadraId}` : '/jazigos');
          router.refresh();
        }
      } catch (err: any) {
        const msg = err.message ?? 'Erro ao salvar';
        setError(msg);
        toast.error(msg);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {!fixedQuadraId && mode === 'create' && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Quadra <span className="text-red-500">*</span>
            </label>
            <select
              name="blockId"
              value={form.blockId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione uma quadra</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.cemetery.name} — Quadra {b.code}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Código <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            required
            maxLength={20}
            placeholder="Ex: J001, A-01"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Selecione o tipo</option>
            {TIPO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Referência de localização
          </label>
          <input
            type="text"
            name="locationRef"
            value={form.locationRef}
            onChange={handleChange}
            maxLength={200}
            placeholder="Ex: Fileira 3, Coluna 5"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Informações adicionais..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending ? <><Spinner className="mr-2" />Salvando...</> : mode === 'create' ? 'Criar jazigo' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
