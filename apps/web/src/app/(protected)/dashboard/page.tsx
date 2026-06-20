'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, Shovel, Users, FileText,
  TrendingUp, TrendingDown, Minus, Clock,
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
  return <div className="h-[200px] bg-muted rounded-lg animate-pulse" />;
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
  CREATE: 'Cadastrou', UPDATE: 'Atualizou', DELETE: 'Removeu',
  ACTIVATE: 'Ativou', DEACTIVATE: 'Desativou', ISSUE: 'Emitiu',
};
const ENTITY_LABELS: Record<string, string> = {
  Cemetery: 'cemitério', Block: 'quadra', Grave: 'jazigo',
  Deceased: 'falecido', Burial: 'sepultamento', Document: 'documento',
  User: 'usuário', Group: 'grupo',
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
      <span className="inline-flex items-center gap-0.5 text-[11px] font-[600] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
        <TrendingUp size={10} />+{value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-[600] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
        <TrendingDown size={10} />{value}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-[600] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
      <Minus size={10} />sem variação
    </span>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
    </div>
  );
}

const KPI_META = [
  {
    key: 'graves',
    label: 'Jazigos',
    icon: MapPin,
    gradient: 'from-blue-500/20 to-blue-500/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
    ring: 'ring-blue-500/20',
  },
  {
    key: 'burials',
    label: 'Sepultamentos',
    icon: Shovel,
    gradient: 'from-orange-500/20 to-orange-500/5',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-600',
    ring: 'ring-orange-500/20',
  },
  {
    key: 'deceased',
    label: 'Falecidos',
    icon: Users,
    gradient: 'from-violet-500/20 to-violet-500/5',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    ring: 'ring-violet-500/20',
  },
  {
    key: 'documents',
    label: 'Documentos',
    icon: FileText,
    gradient: 'from-teal-500/20 to-teal-500/5',
    iconBg: 'bg-teal-500/10',
    iconColor: 'text-teal-600',
    ring: 'ring-teal-500/20',
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/dashboard/summary')
      .then((data) => setSummary(data as DashboardSummary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = summary
    ? [
        {
          meta: KPI_META[0],
          value: summary.graves.total.toLocaleString('pt-BR'),
          sub: `${summary.graves.occupancyRate}% ocupados`,
          trend: null,
          extra: (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Ocupação</span>
                <span>{summary.graves.occupancyRate}%</span>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, summary.graves.occupancyRate)}%` }}
                />
              </div>
            </div>
          ),
        },
        {
          meta: KPI_META[1],
          value: summary.burials.thisMonth.toLocaleString('pt-BR'),
          sub: 'este mês',
          trend: summary.burials.trend,
          extra: null,
        },
        {
          meta: KPI_META[2],
          value: summary.deceased.total.toLocaleString('pt-BR'),
          sub: 'cadastrados',
          trend: null,
          extra: null,
        },
        {
          meta: KPI_META[3],
          value: summary.documents.thisMonth.toLocaleString('pt-BR'),
          sub: 'emitidos este mês',
          trend: summary.documents.trend,
          extra: null,
        },
      ]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-[800] text-foreground tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Bem-vindo, <span className="font-[600] text-foreground">{session?.user?.name}</span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis?.map(({ meta, value, sub, trend, extra }) => (
              <div
                key={meta.label}
                className={cn(
                  'relative bg-card border border-border rounded-xl p-5 overflow-hidden',
                  'shadow-[0_1px_4px_rgba(0,0,0,0.04)]',
                  'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow',
                )}
              >
                {/* corner gradient accent */}
                <div className={cn(
                  'absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] bg-gradient-to-bl opacity-60',
                  meta.gradient,
                )} />

                <div className="relative flex items-start justify-between mb-3">
                  <span className="text-[11px] font-[700] uppercase tracking-[0.08em] text-muted-foreground">
                    {meta.label}
                  </span>
                  <span className={cn(
                    'p-2 rounded-[10px]',
                    meta.iconBg,
                    `ring-1 ${meta.ring}`,
                  )}>
                    <meta.icon size={15} className={meta.iconColor} />
                  </span>
                </div>

                <p className="relative text-[32px] font-[800] text-foreground leading-none mb-1">
                  {value}
                </p>
                <div className="relative flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-muted-foreground">{sub}</span>
                  {trend !== null && <TrendBadge value={trend} />}
                </div>
                {extra && <div className="relative">{extra}</div>}
              </div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h2 className="text-[13px] font-[700] text-foreground mb-0.5">Jazigos por status</h2>
          <p className="text-[11px] text-muted-foreground mb-4">Distribuição atual do cemitério</p>
          {loading ? <ChartSkeleton /> : summary ? <GravesDonutChart data={summary.graves} /> : null}
          {!loading && summary && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {[
                { label: 'Disponíveis', value: summary.graves.available, color: 'bg-green-500' },
                { label: 'Ocupados', value: summary.graves.occupied, color: 'bg-red-500' },
                { label: 'Reservados', value: summary.graves.reserved, color: 'bg-amber-500' },
                { label: 'Interditados', value: summary.graves.blocked, color: 'bg-muted-foreground/40' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', s.color)} />
                  {s.label}: <span className="font-[600] text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <h2 className="text-[13px] font-[700] text-foreground mb-0.5">Sepultamentos por mês</h2>
          <p className="text-[11px] text-muted-foreground mb-4">Últimos 6 meses</p>
          {loading ? <ChartSkeleton /> : summary ? <BurialsBarChart data={summary.burials.byMonth} /> : null}
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-muted">
            <Clock size={13} className="text-muted-foreground" />
          </div>
          <h2 className="text-[13px] font-[700] text-foreground">Atividade recente</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-2.5 bg-muted rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !summary?.recentActivity.length ? (
          <p className="text-[13px] text-muted-foreground text-center py-6">
            Nenhuma atividade registrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {summary.recentActivity.map((log) => {
              const actionLabel = ACTION_LABELS[log.action] ?? log.action;
              const entityLabel = ENTITY_LABELS[log.entityType] ?? log.entityType.toLowerCase();
              return (
                <li key={log.id} className="py-3 flex items-start gap-3">
                  <span className="w-[7px] h-[7px] rounded-full bg-primary mt-[5px] shrink-0 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground">
                      <span className="font-[600]">{actionLabel}</span>{' '}
                      <span className="text-muted-foreground">{entityLabel}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
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
