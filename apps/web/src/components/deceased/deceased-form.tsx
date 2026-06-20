'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';

interface DeceasedFormData {
  fullName: string;
  birthDate: string;
  deathDate: string;
  cpf: string;
  causeOfDeath: string;
  birthPlace: string;
  nationality: string;
  fatherName: string;
  motherName: string;
  notes: string;
}

interface DeceasedFormProps {
  initialData?: Partial<DeceasedFormData> & { id?: string };
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SENSITIVE_ROLES = ['ADMIN', 'MANAGER'];

export function DeceasedForm({ initialData, mode, onSuccess, onCancel }: DeceasedFormProps) {
  const router = useRouter();
  const { data: session } = useSession() as { data: { roles?: string[] } | null };
  const roles: string[] = (session as any)?.roles ?? [];
  const canSeeSensitive = roles.some((r) => SENSITIVE_ROLES.includes(r));

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [form, setForm] = useState<DeceasedFormData>({
    fullName: initialData?.fullName ?? '',
    birthDate: initialData?.birthDate ?? '',
    deathDate: initialData?.deathDate ?? '',
    cpf: initialData?.cpf ?? '',
    causeOfDeath: initialData?.causeOfDeath ?? '',
    birthPlace: initialData?.birthPlace ?? '',
    nationality: initialData?.nationality ?? 'Brasileira',
    fatherName: initialData?.fatherName ?? '',
    motherName: initialData?.motherName ?? '',
    notes: initialData?.notes ?? '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const payload: any = {
      fullName: form.fullName.trim(),
      birthDate: form.birthDate,
      deathDate: form.deathDate,
      birthPlace: form.birthPlace.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
      fatherName: form.fatherName.trim() || undefined,
      motherName: form.motherName.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    if (canSeeSensitive) {
      if (form.cpf.trim()) payload.cpf = form.cpf.trim();
      if (form.causeOfDeath.trim()) payload.causeOfDeath = form.causeOfDeath.trim();
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await api.post('/api/v1/deceased', payload);
        } else {
          await api.patch(`/api/v1/deceased/${initialData!.id}`, payload);
        }
        toast.success('Falecido salvo com sucesso.');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/falecidos');
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
              name="fullName"
              value={form.fullName}
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
              name="birthDate"
              value={form.birthDate}
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
              name="deathDate"
              value={form.deathDate}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Naturalidade</label>
            <input
              type="text"
              name="birthPlace"
              value={form.birthPlace}
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
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              maxLength={100}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome do pai</label>
            <input
              type="text"
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              maxLength={200}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da mãe</label>
            <input
              type="text"
              name="motherName"
              value={form.motherName}
              onChange={handleChange}
              maxLength={200}
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
                name="causeOfDeath"
                value={form.causeOfDeath}
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
          {isPending ? <><Spinner className="mr-2" />Salvando...</> : mode === 'create' ? 'Registrar falecido' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
