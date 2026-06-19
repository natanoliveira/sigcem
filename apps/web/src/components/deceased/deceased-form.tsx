'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';

interface DeceasedFormData {
  nomeCompleto: string;
  dataNascimento: string;
  dataFalecimento: string;
  cpf: string;
  causaMortis: string;
  naturalidade: string;
  nacionalidade: string;
  nomePai: string;
  nomeMae: string;
  observacoes: string;
}

interface DeceasedFormProps {
  initialData?: Partial<DeceasedFormData> & { id?: string };
  mode: 'create' | 'edit';
}

const SENSITIVE_ROLES = ['ADMIN', 'GESTOR'];

export function DeceasedForm({ initialData, mode }: DeceasedFormProps) {
  const router = useRouter();
  const { data: session } = useSession() as { data: { roles?: string[] } | null };
  const roles: string[] = (session as any)?.roles ?? [];
  const canSeeSensitive = roles.some((r) => SENSITIVE_ROLES.includes(r));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<DeceasedFormData>({
    nomeCompleto: initialData?.nomeCompleto ?? '',
    dataNascimento: initialData?.dataNascimento ?? '',
    dataFalecimento: initialData?.dataFalecimento ?? '',
    cpf: initialData?.cpf ?? '',
    causaMortis: initialData?.causaMortis ?? '',
    naturalidade: initialData?.naturalidade ?? '',
    nacionalidade: initialData?.nacionalidade ?? 'Brasileira',
    nomePai: initialData?.nomePai ?? '',
    nomeMae: initialData?.nomeMae ?? '',
    observacoes: initialData?.observacoes ?? '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const payload: any = {
      nomeCompleto: form.nomeCompleto.trim(),
      dataNascimento: form.dataNascimento,
      dataFalecimento: form.dataFalecimento,
      naturalidade: form.naturalidade.trim() || undefined,
      nacionalidade: form.nacionalidade.trim() || undefined,
      nomePai: form.nomePai.trim() || undefined,
      nomeMae: form.nomeMae.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
    };

    if (canSeeSensitive) {
      if (form.cpf.trim()) payload.cpf = form.cpf.trim();
      if (form.causaMortis.trim()) payload.causaMortis = form.causaMortis.trim();
    }

    try {
      if (mode === 'create') {
        await api.post('/api/v1/deceased', payload);
      } else {
        await api.patch(`/api/v1/deceased/${initialData!.id}`, payload);
      }
      router.push('/falecidos');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Dados básicos */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Dados pessoais</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nome completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nomeCompleto"
              value={form.nomeCompleto}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="Nome completo do falecido"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data de nascimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dataNascimento"
              value={form.dataNascimento}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Data de falecimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dataFalecimento"
              value={form.dataFalecimento}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Naturalidade</label>
            <input
              type="text"
              name="naturalidade"
              value={form.naturalidade}
              onChange={handleChange}
              maxLength={100}
              placeholder="Cidade — Estado"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nacionalidade</label>
            <input
              type="text"
              name="nacionalidade"
              value={form.nacionalidade}
              onChange={handleChange}
              maxLength={100}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome do pai</label>
            <input
              type="text"
              name="nomePai"
              value={form.nomePai}
              onChange={handleChange}
              maxLength={200}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da mãe</label>
            <input
              type="text"
              name="nomeMae"
              value={form.nomeMae}
              onChange={handleChange}
              maxLength={200}
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
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Dados sensíveis LGPD — visíveis apenas para ADMIN/GESTOR */}
      {canSeeSensitive ? (
        <div className="bg-white rounded-xl border border-amber-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-neutral-900">Dados sensíveis</h2>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
              LGPD — restrito
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
              <p className="mt-1 text-xs text-neutral-500">Armazenado de forma criptografada</p>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Causa mortis</label>
              <textarea
                name="causaMortis"
                value={form.causaMortis}
                onChange={handleChange}
                rows={2}
                maxLength={500}
                placeholder="Conforme declaração de óbito"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
              <p className="mt-1 text-xs text-neutral-500">Armazenada de forma criptografada</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 text-sm text-neutral-500">
          <span className="text-base">🔒</span>
          CPF e causa mortis são campos de acesso restrito e não estão disponíveis para o seu perfil.
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
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
          {submitting ? 'Salvando...' : mode === 'create' ? 'Registrar falecido' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
