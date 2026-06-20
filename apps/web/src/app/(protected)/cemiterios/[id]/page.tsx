'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, LayoutGrid } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Cemetery {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  areaM2: number | null;
  capacity: number | null;
  status: string;
  createdAt: string;
  blocks: { id: string; code: string; name: string | null; status: string; _count: { graves: number } }[];
}

export default function DetalheCemiterioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cemetery, setCemetery] = useState<Cemetery | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCemetery = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/v1/cemeteries/${id}`);
      setCemetery(data);
    } catch {
      router.replace('/cemiterios');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchCemetery(); }, [fetchCemetery]);

  if (loading || !cemetery) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="bg-card rounded-xl border border-border p-6 h-64 animate-pulse" />
      </div>
    );
  }

  const createdAt = new Date(cemetery.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={cemetery.name}
        breadcrumbs={[
          { label: 'Estrutura' },
          { label: 'Cemitérios', href: '/cemiterios' },
          { label: cemetery.name },
        ]}
        action={
          <Link href={`/cemiterios/${id}/editar`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-[600] text-white bg-primary rounded-lg hover:bg-primary/90">
            <Pencil size={13} />Editar
          </Link>
        }
      />

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="blocks">Quadras ({cemetery.blocks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Status</dt>
                <dd className="mt-1"><StatusBadge status={cemetery.status} /></dd>
              </div>
              <div>
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Cadastrado em</dt>
                <dd className="mt-1 text-[13px] text-foreground">{createdAt}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Endereço</dt>
                <dd className="mt-1 text-[13px] text-foreground">{cemetery.address}</dd>
              </div>
              {cemetery.neighborhood && (
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Bairro</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{cemetery.neighborhood}</dd>
                </div>
              )}
              {cemetery.areaM2 != null && (
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Área</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{Number(cemetery.areaM2).toLocaleString('pt-BR')} m²</dd>
                </div>
              )}
              {cemetery.capacity != null && (
                <div>
                  <dt className="text-[10px] font-[700] uppercase tracking-wider text-muted-foreground">Capacidade</dt>
                  <dd className="mt-1 text-[13px] text-foreground">{cemetery.capacity.toLocaleString('pt-BR')} jazigos</dd>
                </div>
              )}
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="blocks" className="mt-4">
          <div className="bg-card rounded-xl border border-border">
            {cemetery.blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <LayoutGrid size={28} className="text-muted-foreground/40" />
                <p className="text-[13px] text-muted-foreground">Nenhuma quadra cadastrada</p>
                <Link href={`/quadras?cemiterioId=${id}`}
                  className="text-[12px] text-primary hover:underline">
                  Adicionar quadra
                </Link>
              </div>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {['Código', 'Nome', 'Jazigos', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-[700] text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cemetery.blocks.map((q) => (
                    <tr key={q.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-[700] text-foreground">{q.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">{q.name ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{q._count.graves}</td>
                      <td className="px-4 py-3"><StatusBadge status={q.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/quadras/${q.id}`} className="text-[12px] text-primary hover:underline">Ver</Link>
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
