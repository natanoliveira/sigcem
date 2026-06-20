'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const TIPO_LABEL: Record<string, string> = {
  SINGLE: 'Simples', DOUBLE: 'Duplo', DRAWER: 'Gaveta',
  OSSUARY: 'Ossário', PERPETUAL: 'Perpétuo',
};

interface Grave {
  id: string; code: string; type: string; status: string; locationRef: string | null;
}

interface Quadra {
  id: string; code: string; name: string | null; capacity: number | null; status: string;
  createdAt: string;
  cemetery: { id: string; name: string };
  graves: Grave[];
}

export default function DetalheQuadraPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quadra, setQuadra] = useState<Quadra | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuadra = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/blocks/${id}`);
      setQuadra(data);
    } catch {
      router.replace('/quadras');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchQuadra(); }, [fetchQuadra]);

  if (loading || !quadra) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="bg-card rounded-xl border border-border p-6 h-48 animate-pulse" />
      </div>
    );
  }

  const createdAt = new Date(quadra.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quadra ${quadra.code}`}
        description={quadra.name ?? undefined}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Quadras', href: '/quadras' },
          { label: quadra.code },
        ]}
        action={
          <Link href={`/quadras/${id}/editar`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Pencil size={13} />Editar
          </Link>
        }
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="graves">Jazigos ({quadra.graves.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Status</dt>
                <dd className="mt-1"><StatusBadge status={quadra.status} /></dd>
              </div>
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cemitério</dt>
                <dd className="mt-1">
                  <Link href={`/cemiterios/${quadra.cemetery.id}`} className="text-[13px] text-primary hover:underline">
                    {quadra.cemetery.name}
                  </Link>
                </dd>
              </div>
              {quadra.capacity != null && (
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Capacidade</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{quadra.capacity.toLocaleString('pt-BR')} jazigos</dd>
                </div>
              )}
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cadastrado em</dt>
                <dd className="mt-1 text-[13px] text-foreground">{createdAt}</dd>
              </div>
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="graves" className="mt-4">
          <div className="bg-card rounded-xl border border-border">
            {quadra.graves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <MapPin size={28} className="text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground">Nenhum jazigo cadastrado nesta quadra</p>
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Código', 'Tipo', 'Localização', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {quadra.graves.map((j) => (
                    <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-[700] text-foreground">{j.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{TIPO_LABEL[j.type] ?? j.type}</td>
                      <td className="px-4 py-3 text-muted-foreground/70 text-[12px]">{j.locationRef ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/jazigos/${j.id}`} className="text-[12px] text-primary hover:underline">Ver</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
