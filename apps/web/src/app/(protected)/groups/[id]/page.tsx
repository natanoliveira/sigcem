'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserMinus, UserPlus, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function GroupDetailPage({ params }: Props) {
  const { id } = use(params);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<GroupMember | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchGroup = useCallback(async () => {
    setLoadingGroup(true);
    try {
      const data = await api.get(`/api/v1/groups/${id}`);
      setGroup(data);
    } catch {
      setGroup(null);
    } finally {
      setLoadingGroup(false);
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await api.get(`/api/v1/groups/${id}/members`);
      setMembers(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [id]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/iam/users?limit=200');
      setAllUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    fetchGroup();
    fetchMembers();
    fetchAllUsers();
  }, [fetchGroup, fetchMembers, fetchAllUsers]);

  function handleAddMember() {
    setAddError(null);
    if (!selectedUserId) {
      setAddError('Selecione um usuário para adicionar.');
      return;
    }
    startTransition(async () => {
      try {
        await api.post(`/api/v1/groups/${id}/members`, { userId: selectedUserId });
        setSelectedUserId('');
        fetchMembers();
      } catch (err: unknown) {
        setAddError(err instanceof Error ? err.message : 'Erro ao adicionar membro.');
      }
    });
  }

  function handleRemoveMember() {
    if (!removeTarget) return;
    startTransition(async () => {
      try {
        await api.delete(`/api/v1/groups/${id}/members/${removeTarget.id}`);
        setRemoveTarget(null);
        fetchMembers();
      } catch {}
    });
  }

  const memberIds = new Set(members.map((m) => m.id));
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id));

  if (loadingGroup) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Grupo não encontrado"
          breadcrumbs={[{ label: 'Gestão' }, { label: 'Grupos', href: '/groups' }, { label: 'Não encontrado' }]}
        />
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-500">O grupo solicitado não existe ou foi removido.</p>
          <Link href="/groups" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <ArrowLeft size={14} /> Voltar para grupos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={group.name}
        breadcrumbs={[
          { label: 'Gestão' },
          { label: 'Grupos', href: '/groups' },
          { label: group.name },
        ]}
        action={
          <Link
            href={`/groups/${id}/permissions`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
          >
            <ShieldCheck size={15} />
            Permissões
          </Link>
        }
      />

      {/* Informações do grupo */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Informações do grupo</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Status</dt>
            <dd className="mt-1"><StatusBadge status={group.status} /></dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-neutral-500 uppercase tracking-wide font-medium">Descrição</dt>
            <dd className="mt-1 text-sm text-neutral-900">{group.description ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Seção Membros */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Membros</h2>
          <span className="text-xs text-neutral-500">{members.length} membro{members.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Adicionar membro */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
          <p className="text-xs font-medium text-neutral-700 mb-2">Adicionar membro</p>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); setAddError(null); }}
              className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Selecione um usuário...</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddMember}
              disabled={isPending || !selectedUserId}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <UserPlus size={14} />
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
          {addError && (
            <p className="mt-2 text-xs text-red-600">{addError}</p>
          )}
        </div>

        {/* Lista de membros */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Perfil</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {loadingMembers ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-neutral-50">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={UserPlus}
                      title="Nenhum membro neste grupo."
                      description="Use o campo acima para adicionar usuários ao grupo."
                    />
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-neutral-900">{m.name}</td>
                    <td className="px-6 py-3 text-neutral-600">{m.email}</td>
                    <td className="px-6 py-3 text-neutral-500 text-xs">{m.role}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setRemoveTarget(m)}
                          className="p-1.5 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          title="Remover do grupo"
                        >
                          <UserMinus size={15} />
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

      <ConfirmDialog
        open={!!removeTarget}
        title="Remover membro"
        description={`Tem certeza que deseja remover "${removeTarget?.name}" do grupo?`}
        confirmLabel="Remover"
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTarget(null)}
        loading={isPending}
      />
    </div>
  );
}
