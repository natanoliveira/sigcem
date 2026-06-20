'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Shovel,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const GravesDonutChart = dynamic(
  () => import('@/components/charts/graves-donut-chart'),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

const BurialsBarChart = dynamic(
  () => import('@/components/charts/burials-bar-chart'),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

function ChartSkeleton() {
  return <div className="h-[200px] bg-neutral-100 rounded-lg animate-pulse" />;
}

interface DashboardSummary {
  graves: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    blocked: number;
    occupancyRate: number;
  };
  burials: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
    byMonth: Array<{ month: string; count: number }>;
  };
  deceased: { total: number };
  documents: { thisMonth: number; lastMonth: number; trend: number };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    createdAt: string;
  }>;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Cadastrou',
  UPDATE: 'Atualizou',
  DELETE: 'Removeu',
  ACTIVATE: 'Ativou',
  DEACTIVATE: 'Desativou',
  ISSUE: 'Emitiu',
};

const ENTITY_LABELS: Record<string, string> = {
  Cemetery: 'cemitério',
  Block: 'quadra',
  Grave: 'jazigo',
  Deceased: 'falecido',
  Burial: 'sepultamento',
  Document: 'documento',
  User: 'usuário',
  Group: 'grupo',
};

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600">
        <TrendingUp size={12} />+{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
        <TrendingDown size={12} />{value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-neutral-400">
      <Minus size={12} />sem variação
    </span>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3 shadow-sm">
      <div className="h-3 w-24 bg-neutral-100 rounded animate-pulse" />
      <div className="h-8 w-16 bg-neutral-100 rounded animate-pulse" />
      <div className="h-3 w-32 bg-neutral-100 rounded animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/dashboard/summary')
      .then((data) => setSummary(data as DashboardSummary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = summary
    ? [
        {
          label: 'Jazigos',
          value: summary.graves.total.toLocaleString('pt-BR'),
          sub: `${summary.graves.occupancyRate}% ocupados`,
          icon: MapPin,
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          trend: null,
        },
        {
          label: 'Sepultamentos',
          value: summary.burials.thisMonth.toLocaleString('pt-BR'),
          sub: 'este mês',
          icon: Shovel,
          iconBg: 'bg-orange-50',
          iconColor: 'text-orange-600',
          trend: summary.burials.trend,
        },
        {
          label: 'Falecidos',
          value: summary.deceased.total.toLocaleString('pt-BR'),
          sub: 'cadastrados',
          icon: Users,
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-600',
          trend: null,
        },
        {
          label: 'Documentos',
          value: summary.documents.thisMonth.toLocaleString('pt-BR'),
          sub: 'emitidos este mês',
          icon: FileText,
          iconBg: 'bg-teal-50',
          iconColor: 'text-teal-600',
          trend: summary.documents.trend,
        },
      ]
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Bem-vindo, {session?.user?.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis?.map((kpi) => (
              <div
                key={kpi.label}
                className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <span className={cn('p-2 rounded-lg', kpi.iconBg)}>
                    <kpi.icon size={16} className={kpi.iconColor} />
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-neutral-900">{kpi.value}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-neutral-500">{kpi.sub}</span>
                    {kpi.trend !== null && <TrendBadge value={kpi.trend} />}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900 mb-1">Jazigos por status</h2>
          <p className="text-xs text-neutral-400 mb-4">Distribuição atual do cemitério</p>
          {loading ? (
            <ChartSkeleton />
          ) : summary ? (
            <GravesDonutChart data={summary.graves} />
          ) : null}
          {!loading && summary && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Disponíveis', value: summary.graves.available, color: 'bg-green-500' },
                { label: 'Ocupados', value: summary.graves.occupied, color: 'bg-red-500' },
                { label: 'Reservados', value: summary.graves.reserved, color: 'bg-amber-500' },
                { label: 'Interditados', value: summary.graves.blocked, color: 'bg-neutral-400' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs text-neutral-600">
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0', s.color)} />
                  {s.label}: <span className="font-semibold text-neutral-900">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900 mb-1">Sepultamentos por mês</h2>
          <p className="text-xs text-neutral-400 mb-4">Últimos 6 meses</p>
          {loading ? (
            <ChartSkeleton />
          ) : summary ? (
            <BurialsBarChart data={summary.burials.byMonth} />
          ) : null}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={15} className="text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-900">Atividade recente</h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !summary?.recentActivity.length ? (
          <p className="text-sm text-neutral-400 text-center py-4">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {summary.recentActivity.map((log) => {
              const actionLabel = ACTION_LABELS[log.action] ?? log.action;
              const entityLabel = ENTITY_LABELS[log.entityType] ?? log.entityType.toLowerCase();
              return (
                <li key={log.id} className="py-3 flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900">
                      <span className="font-medium">{actionLabel}</span>{' '}
                      <span className="text-neutral-500">{entityLabel}</span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {formatRelative(log.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
