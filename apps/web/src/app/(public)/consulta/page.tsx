'use client';

import { useState } from 'react';
import { Search, MapPin, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface Localizacao {
  cemiterio: string;
  quadra: string;
  jazigo: string;
  dataInumacao: string;
}

interface Falecido {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  dataFalecimento: string;
  naturalidade: string | null;
  localizacao: Localizacao | null;
}

interface ApiResponse {
  data: Falecido[];
  meta: { total: number; page: number; totalPages: number; limit: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function ConsultaPublicaPage() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);

  async function handleSearch(e: React.FormEvent, p = 1) {
    e.preventDefault();
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    setPage(p);
    try {
      const params = new URLSearchParams({ nome: search.trim(), page: String(p), limit: '10' });
      const res = await fetch(`${API_URL}/api/public/v1/deceased?${params}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900">Consulta de Falecidos</h1>
        <p className="text-neutral-500 text-sm">
          Pesquise pelo nome para localizar o jazigo de um ente querido.
        </p>
      </div>

      <form onSubmit={(e) => handleSearch(e, 1)} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite o nome completo ou parcial..."
            className="w-full pl-10 pr-4 py-3 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !search.trim()}
          className="px-5 py-3 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {searched && !loading && (
        <div className="space-y-3">
          {result?.data.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 px-6 py-10 text-center">
              <p className="text-neutral-500 text-sm">Nenhum registro encontrado para "{search}".</p>
              <p className="text-neutral-400 text-xs mt-1">Tente variações do nome ou verifique a grafia.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                {result?.meta.total} resultado{(result?.meta.total ?? 0) !== 1 ? 's' : ''} encontrado{(result?.meta.total ?? 0) !== 1 ? 's' : ''}
              </p>
              {result?.data.map((f) => (
                <div key={f.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                  <h2 className="text-base font-semibold text-neutral-900">{f.nomeCompleto}</h2>

                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar size={13} />
                      <span>Nascimento: {formatDate(f.dataNascimento)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <Calendar size={13} />
                      <span>Falecimento: {formatDate(f.dataFalecimento)}</span>
                    </div>
                    {f.naturalidade && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                        <MapPin size={13} />
                        <span>{f.naturalidade}</span>
                      </div>
                    )}
                  </div>

                  {f.localizacao ? (
                    <div className="mt-3 flex items-start gap-2 p-3 bg-primary-50 rounded-lg">
                      <MapPin size={15} className="text-primary-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-primary-800">{f.localizacao.cemiterio}</p>
                        <p className="text-primary-600 text-xs mt-0.5">
                          Quadra {f.localizacao.quadra} · Jazigo {f.localizacao.jazigo} ·{' '}
                          Inumado em {formatDate(f.localizacao.dataInumacao)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-neutral-400">Localização não disponível no sistema.</p>
                  )}
                </div>
              ))}

              {result && result.meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={(e) => handleSearch(e as any, page - 1)}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-500">
                    {page} / {result.meta.totalPages}
                  </span>
                  <button
                    onClick={(e) => handleSearch(e as any, page + 1)}
                    disabled={page === result.meta.totalPages || loading}
                    className="px-4 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-xl border border-neutral-200 px-6 py-10 text-center">
          <Search size={32} className="mx-auto text-neutral-200 mb-3" />
          <p className="text-sm text-neutral-400">
            Digite o nome de um falecido para localizar o jazigo.
          </p>
          <p className="text-xs text-neutral-300 mt-1">
            Esta consulta é pública e não requer login.
          </p>
        </div>
      )}
    </div>
  );
}
