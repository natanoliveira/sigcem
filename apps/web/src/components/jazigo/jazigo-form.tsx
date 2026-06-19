'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const TIPO_OPTIONS = [
  { value: 'SIMPLES', label: 'Simples' },
  { value: 'DUPLO', label: 'Duplo' },
  { value: 'GAVETA', label: 'Gaveta' },
  { value: 'OSSUARIO', label: 'Ossário' },
  { value: 'PERPETUO', label: 'Perpétuo' },
];

interface Quadra {
  id: string;
  codigo: string;
  cemiterio: { nome: string };
}

interface JazigoFormData {
  quadraId: string;
  codigo: string;
  tipo: string;
  localizacaoRef: string;
  observacoes: string;
}

interface JazigoFormProps {
  initialData?: Partial<JazigoFormData> & { id?: string };
  mode: 'create' | 'edit';
  fixedQuadraId?: string;
}

export function JazigoForm({ initialData, mode, fixedQuadraId }: JazigoFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [form, setForm] = useState<JazigoFormData>({
    quadraId: fixedQuadraId ?? initialData?.quadraId ?? '',
    codigo: initialData?.codigo ?? '',
    tipo: initialData?.tipo ?? '',
    localizacaoRef: initialData?.localizacaoRef ?? '',
    observacoes: initialData?.observacoes ?? '',
  });

  useEffect(() => {
    if (!fixedQuadraId && mode === 'create') {
      api.get('/api/v1/quadras?limit=200').then((r) => setQuadras(r.data ?? []));
    }
  }, [fixedQuadraId, mode]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload = {
      quadraId: form.quadraId,
      codigo: form.codigo.trim().toUpperCase(),
      tipo: form.tipo,
      localizacaoRef: form.localizacaoRef.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        await api.post('/api/v1/jazigos', payload);
      } else {
        const { quadraId: _, ...updatePayload } = payload;
        await api.patch(`/api/v1/jazigos/${initialData!.id}`, updatePayload);
      }
      router.push(fixedQuadraId ? `/quadras/${fixedQuadraId}` : '/jazigos');
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
        {!fixedQuadraId && mode === 'create' && (
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Quadra <span className="text-red-500">*</span>
            </label>
            <select
              name="quadraId"
              value={form.quadraId}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Selecione uma quadra</option>
              {quadras.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.cemiterio.nome} — Quadra {q.codigo}
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
            name="codigo"
            value={form.codigo}
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
            name="tipo"
            value={form.tipo}
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
            name="localizacaoRef"
            value={form.localizacaoRef}
            onChange={handleChange}
            maxLength={200}
            placeholder="Ex: Fileira 3, Coluna 5"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
          <textarea
            name="observacoes"
            value={form.observacoes}
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
          {submitting ? 'Salvando...' : mode === 'create' ? 'Criar jazigo' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
