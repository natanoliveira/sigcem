'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Cemetery {
  id: string;
  name: string;
}

interface BlockFormData {
  cemeteryId: string;
  code: string;
  name: string;
  capacity: string;
}

interface QuadraFormProps {
  initialData?: Partial<BlockFormData> & { id?: string };
  mode: 'create' | 'edit';
  fixedCemiterioId?: string;
}

export function QuadraForm({ initialData, mode, fixedCemiterioId }: QuadraFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [cemeteries, setCemeteries] = useState<Cemetery[]>([]);
  const [form, setForm] = useState<BlockFormData>({
    cemeteryId: fixedCemiterioId ?? initialData?.cemeteryId ?? '',
    code: initialData?.code ?? '',
    name: initialData?.name ?? '',
    capacity: initialData?.capacity ?? '',
  });

  useEffect(() => {
    if (!fixedCemiterioId) {
      api.get('/api/v1/cemeteries?limit=100').then((r) => setCemeteries(r.data ?? []));
    }
  }, [fixedCemiterioId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      cemeteryId: form.cemeteryId,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim() || undefined,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/v1/blocks', payload);
      } else {
        const { cemeteryId: _, ...updatePayload } = payload;
        await api.patch(`/api/v1/blocks/${initialData!.id}`, updatePayload);
      }
      router.push(fixedCemiterioId ? `/cemiterios/${fixedCemiterioId}` : '/quadras');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {!fixedCemiterioId && mode === 'create' && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cemitério <span className="text-red-500">*</span>
            </label>
            <select
              name="cemeteryId"
              value={form.cemeteryId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione um cemitério</option>
              {cemeteries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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
            placeholder="Ex: A, B, Q01"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Nome</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={100}
            placeholder="Nome descritivo (opcional)"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Capacidade (jazigos)
          </label>
          <input
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            min={0}
            step={1}
            placeholder="0"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando...' : mode === 'create' ? 'Criar quadra' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
