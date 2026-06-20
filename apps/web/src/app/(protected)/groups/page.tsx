'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, Search, Trash2, ChevronRight, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface Group {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  _count?: { members: number };
}

interface CreateGroupForm {
  name: string;
  description: string;
}

const EMPTY_FORM: CreateGroupForm = { name: '', description: '' };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateGroupForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function fetchData() {
    setLoading(true);
    api
      .get('/api/v1/groups')
      .then((data) => setGroups(Array.isArray(data) ? (data as Group[]) : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = groups.filter((g) =>
    !search || g.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await api.delete(`/api/v1/groups/${deleteTarget.id}`);
        setDeleteTarget(null);
        fetchData();
      } catch {}
    });
  }

  function handleCreate() {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('O nome do grupo é obrigatório.');
      return;
    }
    startTransition(async () => {
      try {
        await api.post('/api/v1/groups', form);
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchData();
      } catch (err: unknown) {
        setFormError(err instanceof Error ? err.message : 'Erro ao criar grupo.');
      }
    });
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupos"
        description="Gerencie os grupos de acesso do sistema"
        breadcrumbs={[{ label: 'Gestão' }, { label: 'Grupos' }]}
        action={
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <Plus size={16} />
            Novo grupo
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Membros</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Shield}
                      title={search ? 'Nenhum grupo encontrado para esta busca.' : 'Nenhum grupo cadastrado.'}
                      description={!search ? "Clique em 'Novo grupo' para começar." : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-neutral-900">{g.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{g.description ?? '—'}</td>
                    <td className="px-4 py-3 text-neutral-600">{g._count?.members ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={g.active ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/groups/${g.id}`}
                          className="p-1.5 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                          title="Detalhes"
                        >
                          <ChevronRight size={15} />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Novo grupo</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Operadores de Campo"
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição opcional do grupo..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isPending ? 'Salvando...' : 'Criar grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir grupo"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isPending}
      />
    </div>
  );
}
