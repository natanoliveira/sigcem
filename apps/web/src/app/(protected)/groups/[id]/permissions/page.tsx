'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';

type Action = 'CREATE' | 'VIEW' | 'EDIT' | 'DELETE';

const ACTIONS: Action[] = ['CREATE', 'VIEW', 'EDIT', 'DELETE'];

const ACTION_LABELS: Record<Action, string> = {
  CREATE: 'Criar',
  VIEW: 'Visualizar',
  EDIT: 'Editar',
  DELETE: 'Excluir',
};

type Module =
  | 'CEMETERIES'
  | 'BLOCKS'
  | 'GRAVES'
  | 'DECEASED'
  | 'BURIALS'
  | 'DOCUMENTS'
  | 'AUDIT'
  | 'USERS'
  | 'GROUPS';

const MODULES: Module[] = [
  'CEMETERIES',
  'BLOCKS',
  'GRAVES',
  'DECEASED',
  'BURIALS',
  'DOCUMENTS',
  'AUDIT',
  'USERS',
  'GROUPS',
];

const MODULE_LABELS: Record<Module, string> = {
  CEMETERIES: 'Cemitérios',
  BLOCKS: 'Quadras',
  GRAVES: 'Jazigos',
  DECEASED: 'Falecidos',
  BURIALS: 'Sepultamentos',
  DOCUMENTS: 'Documentos',
  AUDIT: 'Auditoria',
  USERS: 'Usuários',
  GROUPS: 'Grupos',
};

type PermissionMatrix = Record<Module, Set<Action>>;

function buildEmptyMatrix(): PermissionMatrix {
  return Object.fromEntries(MODULES.map((m) => [m, new Set<Action>()])) as PermissionMatrix;
}

interface ApiPermission {
  module: Module;
  actions: Action[];
}

interface Group {
  id: string;
  name: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function GroupPermissionsPage({ params }: Props) {
  const { id } = use(params);

  const [group, setGroup] = useState<Group | null>(null);
  const [matrix, setMatrix] = useState<PermissionMatrix>(buildEmptyMatrix());
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [groupData, permsData] = await Promise.all([
        api.get(`/api/v1/groups/${id}`),
        api.get(`/api/v1/groups/${id}/permissions`),
      ]);
      setGroup(groupData);

      const newMatrix = buildEmptyMatrix();
      const perms: ApiPermission[] = Array.isArray(permsData) ? permsData : permsData.data ?? [];
      for (const p of perms) {
        if (newMatrix[p.module]) {
          newMatrix[p.module] = new Set(p.actions);
        }
      }
      setMatrix(newMatrix);
    } catch {
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleAction(module: Module, action: Action) {
    setMatrix((prev) => {
      const newSet = new Set(prev[module]);
      if (newSet.has(action)) {
        newSet.delete(action);
      } else {
        newSet.add(action);
      }
      return { ...prev, [module]: newSet };
    });
  }

  function toggleAllActions(module: Module) {
    setMatrix((prev) => {
      const current = prev[module];
      const newSet: Set<Action> =
        current.size === ACTIONS.length ? new Set() : new Set(ACTIONS);
      return { ...prev, [module]: newSet };
    });
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);

    const permissions: ApiPermission[] = MODULES
      .filter((m) => matrix[m].size > 0)
      .map((m) => ({ module: m, actions: Array.from(matrix[m]) as Action[] }));

    startTransition(async () => {
      try {
        await api.put(`/api/v1/groups/${id}/permissions`, { permissions });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Erro ao salvar permissões.');
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-neutral-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={group ? `Permissões — ${group.name}` : 'Permissões'}
        breadcrumbs={[
          { label: 'Gestão' },
          { label: 'Grupos', href: '/groups' },
          { label: group?.name ?? '...', href: `/groups/${id}` },
          { label: 'Permissões' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href={`/groups/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50"
            >
              <ArrowLeft size={14} />
              Voltar
            </Link>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <Save size={14} />
              {isPending ? 'Salvando...' : 'Salvar permissões'}
            </button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Permissões salvas com sucesso.
        </div>
      )}

      {saveError && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {saveError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide min-w-[180px]">
                Módulo
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-center">
                Todos
              </th>
              {ACTIONS.map((action) => (
                <th
                  key={action}
                  className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide text-center"
                >
                  {ACTION_LABELS[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) => {
              const checkedCount = matrix[module].size;
              const allChecked = checkedCount === ACTIONS.length;
              const someChecked = checkedCount > 0 && !allChecked;

              return (
                <tr key={module} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-neutral-900">
                    {MODULE_LABELS[module]}
                  </td>

                  {/* Toggle all */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = someChecked;
                      }}
                      onChange={() => toggleAllActions(module)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </td>

                  {ACTIONS.map((action) => (
                    <td key={action} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[module].has(action)}
                        onChange={() => toggleAction(module, action)}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        Apenas módulos com ao menos uma ação selecionada serão incluídos ao salvar.
      </p>
    </div>
  );
}
