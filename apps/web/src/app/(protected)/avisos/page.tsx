'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, AlertCircle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  HIGH:   { label: 'Alta', className: 'bg-destructive/10 text-destructive ring-destructive/20', icon: AlertCircle },
  MEDIUM: { label: 'Média', className: 'bg-amber-500/10 text-amber-600 ring-amber-500/20', icon: Info },
  LOW:    { label: 'Baixa', className: 'bg-muted text-muted-foreground ring-border', icon: Bell },
};

interface Notice {
  id: string;
  title: string;
  body: string;
  priority: string;
  readAt: string | null;
  createdAt: string;
}

interface ApiResponse {
  data: Notice[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AvisosPage() {
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/v1/notices?limit=50');
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function markAsRead(id: string) {
    try {
      await api.patch(`/api/v1/notices/${id}/read`, {});
      setResult((prev) => prev ? ({
        ...prev,
        data: prev.data.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n),
      }) : prev);
    } catch {}
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    try {
      await api.patch('/api/v1/notices/read-all', {});
      await fetchData();
    } catch {} finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = result?.data.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avisos"
        description="Notificações e comunicados do sistema"
        breadcrumbs={[{ label: 'Avisos' }]}
        action={unreadCount > 0 ? (
          <button onClick={markAllAsRead} disabled={markingAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors">
            <CheckCheck size={13} />
            {markingAll ? 'Marcando...' : `Marcar todos como lidos (${unreadCount})`}
          </button>
        ) : undefined}
      />

      <div className="bg-card rounded-xl border border-border shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : result?.data.length === 0 ? (
          <EmptyState icon={Bell} title="Nenhum aviso encontrado." />
        ) : (
          <div className="divide-y divide-border">
            {result?.data.map((notice) => {
              const cfg = PRIORITY_CONFIG[notice.priority] ?? PRIORITY_CONFIG.LOW;
              const Icon = cfg.icon;
              const isUnread = !notice.readAt;
              return (
                <div key={notice.id}
                  className={cn('flex gap-4 px-5 py-4 transition-colors', isUnread ? 'bg-primary/[0.02]' : '')}>
                  <div className={cn('shrink-0 mt-0.5 p-1.5 rounded-md ring-1 ring-inset', cfg.className)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 justify-between">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-[13px]', isUnread ? 'font-[700] text-foreground' : 'font-[500] text-foreground/80')}>
                          {notice.title}
                        </p>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0 whitespace-nowrap">{fmt(notice.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{notice.body}</p>
                    {isUnread && (
                      <button onClick={() => markAsRead(notice.id)}
                        className="mt-2 text-[11px] text-primary hover:underline">
                        Marcar como lido
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
