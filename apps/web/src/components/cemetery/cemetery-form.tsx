'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CemeteryFormData {
  name: string;
  address: string;
  neighborhood: string;
  areaM2: string;
  capacity: string;
}

interface CemeteryFormProps {
  initialData?: Partial<CemeteryFormData> & { id?: string };
  mode: 'create' | 'edit';
}

export function CemeteryForm({ initialData, mode }: CemeteryFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CemeteryFormData>({
    name: initialData?.name ?? '',
    address: initialData?.address ?? '',
    neighborhood: initialData?.neighborhood ?? '',
    areaM2: initialData?.areaM2 ?? '',
    capacity: initialData?.capacity ?? '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      neighborhood: form.neighborhood.trim() || undefined,
      areaM2: form.areaM2 ? parseFloat(form.areaM2) : undefined,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/v1/cemeteries', payload);
      } else {
        await api.patch(`/api/v1/cemeteries/${initialData!.id}`, payload);
      }
      router.push('/cemiterios');
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
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder="Nome do cemitério"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Endereço <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            maxLength={300}
            placeholder="Rua, número, complemento"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Bairro</label>
          <input
            type="text"
            name="neighborhood"
            value={form.neighborhood}
            onChange={handleChange}
            maxLength={100}
            placeholder="Nome do bairro"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Área (m²)
          </label>
          <input
            type="number"
            name="areaM2"
            value={form.areaM2}
            onChange={handleChange}
            min={0}
            step="0.01"
            placeholder="0,00"
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
          {submitting ? 'Salvando...' : mode === 'create' ? 'Criar cemitério' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
