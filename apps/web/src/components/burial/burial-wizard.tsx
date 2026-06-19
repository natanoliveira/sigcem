'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

type BurialType = 'INUMACAO' | 'EXUMACAO' | 'TRANSLADO';

interface Deceased { id: string; nomeCompleto: string; dataFalecimento: string }
interface Jazigo {
  id: string; codigo: string; status: string; tipo: string;
  quadra: { codigo: string; cemiterio: { nome: string } };
}

type Step = 'tipo' | 'falecido' | 'jazigo' | 'destino' | 'detalhes' | 'confirmar';

const TYPE_CONFIG = {
  INUMACAO: {
    label: 'Inumação',
    desc: 'Primeiro sepultamento do falecido',
    jazigoStatus: ['DISPONIVEL', 'RESERVADO'],
    color: 'blue',
  },
  EXUMACAO: {
    label: 'Exumação',
    desc: 'Retirada de restos mortais do jazigo',
    jazigoStatus: ['OCUPADO'],
    color: 'amber',
  },
  TRANSLADO: {
    label: 'Translado',
    desc: 'Transferência entre jazigos',
    jazigoStatus: ['OCUPADO'],
    color: 'purple',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function BurialWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('tipo');
  const [tipo, setTipo] = useState<BurialType | null>(null);
  const [falecido, setFalecido] = useState<Deceased | null>(null);
  const [jazigo, setJazigo] = useState<Jazigo | null>(null);
  const [jazigoDestino, setJazigoDestino] = useState<Jazigo | null>(null);

  const [deceasedSearch, setDeceasedSearch] = useState('');
  const [deceasedResults, setDeceasedResults] = useState<Deceased[]>([]);
  const [jazigoSearch, setJazigoSearch] = useState('');
  const [jazigoResults, setJazigoResults] = useState<Jazigo[]>([]);

  const [form, setForm] = useState({
    dataEvento: new Date().toISOString().split('T')[0],
    autorizadoPor: '',
    funeraria: '',
    responsavelNome: '',
    observacoes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function searchDeceased(q: string) {
    if (q.length < 2) { setDeceasedResults([]); return; }
    const r = await api.get(`/api/v1/deceased?search=${encodeURIComponent(q)}&limit=10`);
    setDeceasedResults(r.data ?? []);
  }

  async function searchJazigo(q: string, statusFilter: string[]) {
    const params = new URLSearchParams({ limit: '20' });
    if (q) params.set('search', q);
    statusFilter.forEach((s) => params.append('status', s));
    const r = await api.get(`/api/v1/jazigos?${params}`);
    setJazigoResults(r.data ?? []);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      if (tipo === 'TRANSLADO') {
        await api.post('/api/v1/burials/translado', {
          falecidoId: falecido!.id,
          jazigoOrigemId: jazigo!.id,
          jazigoDestinoId: jazigoDestino!.id,
          dataEvento: form.dataEvento,
          autorizadoPor: form.autorizadoPor,
          funeraria: form.funeraria || undefined,
          responsavelNome: form.responsavelNome || undefined,
          observacoes: form.observacoes || undefined,
        });
      } else {
        await api.post('/api/v1/burials', {
          falecidoId: falecido!.id,
          jazigoId: jazigo!.id,
          tipo,
          dataEvento: form.dataEvento,
          autorizadoPor: form.autorizadoPor,
          funeraria: form.funeraria || undefined,
          responsavelNome: form.responsavelNome || undefined,
          observacoes: form.observacoes || undefined,
        });
      }
      router.push('/sepultamentos');
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? 'Erro ao registrar');
      setStep('confirmar');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step: Tipo ────────────────────────────────────────────────────────────
  if (step === 'tipo') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">Selecione o tipo de operação:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.entries(TYPE_CONFIG) as [BurialType, typeof TYPE_CONFIG.INUMACAO][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setTipo(key); setStep('falecido'); }}
              className="text-left p-5 bg-white rounded-xl border-2 border-neutral-200 hover:border-primary-400 hover:bg-primary-50 transition-all"
            >
              <p className="font-semibold text-neutral-900">{cfg.label}</p>
              <p className="text-xs text-neutral-500 mt-1">{cfg.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[tipo!];

  // ── Step: Falecido ────────────────────────────────────────────────────────
  if (step === 'falecido') {
    return (
      <div className="space-y-4">
        <StepHeader tipo={tipo!} step={1} label="Selecione o falecido" onBack={() => setStep('tipo')} />
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={deceasedSearch}
            onChange={(e) => { setDeceasedSearch(e.target.value); searchDeceased(e.target.value); }}
            placeholder="Digite o nome..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {deceasedResults.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-50">
            {deceasedResults.map((d) => (
              <button
                key={d.id}
                onClick={() => { setFalecido(d); setStep('jazigo'); searchJazigo('', typeConfig.jazigoStatus); }}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <p className="text-sm font-medium text-neutral-900">{d.nomeCompleto}</p>
                <p className="text-xs text-neutral-500 mt-0.5">Falecido em {formatDate(d.dataFalecimento)}</p>
              </button>
            ))}
          </div>
        )}
        {deceasedSearch.length >= 2 && deceasedResults.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-4">Nenhum falecido encontrado.</p>
        )}
      </div>
    );
  }

  // ── Step: Jazigo (origem para exumação/translado, destino para inumação) ──
  if (step === 'jazigo') {
    const label = tipo === 'INUMACAO'
      ? 'Selecione o jazigo (deve estar disponível)'
      : 'Selecione o jazigo de origem (deve estar ocupado)';

    return (
      <div className="space-y-4">
        <StepHeader tipo={tipo!} step={2} label={label} onBack={() => setStep('falecido')} />
        <div className="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700">
          Falecido: <span className="font-medium">{falecido!.nomeCompleto}</span>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={jazigoSearch}
            onChange={(e) => { setJazigoSearch(e.target.value); searchJazigo(e.target.value, typeConfig.jazigoStatus); }}
            placeholder="Código ou localização..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {jazigoResults.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-50">
            {jazigoResults.map((j) => (
              <button
                key={j.id}
                onClick={() => {
                  setJazigo(j);
                  setStep(tipo === 'TRANSLADO' ? 'destino' : 'detalhes');
                  if (tipo === 'TRANSLADO') {
                    setJazigoSearch('');
                    searchJazigo('', ['DISPONIVEL', 'RESERVADO']);
                  }
                }}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors"
              >
                <p className="text-sm font-medium font-mono text-neutral-900">{j.codigo}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {j.quadra.cemiterio.nome} — Quadra {j.quadra.codigo} · {j.status}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step: Destino (só translado) ──────────────────────────────────────────
  if (step === 'destino') {
    return (
      <div className="space-y-4">
        <StepHeader tipo={tipo!} step={3} label="Selecione o jazigo de destino (deve estar disponível)" onBack={() => setStep('jazigo')} />
        <div className="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700 space-y-1">
          <p>Falecido: <span className="font-medium">{falecido!.nomeCompleto}</span></p>
          <p>Origem: <span className="font-mono font-medium">{jazigo!.codigo}</span> — {jazigo!.quadra.cemiterio.nome}</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={jazigoSearch}
            onChange={(e) => { setJazigoSearch(e.target.value); searchJazigo(e.target.value, ['DISPONIVEL', 'RESERVADO']); }}
            placeholder="Código do jazigo destino..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        {jazigoResults.filter((j) => j.id !== jazigo!.id).map((j) => (
          <button
            key={j.id}
            onClick={() => { setJazigoDestino(j); setStep('detalhes'); }}
            className="w-full text-left px-4 py-3 bg-white rounded-lg border border-neutral-200 hover:border-primary-400 hover:bg-primary-50 transition-colors"
          >
            <p className="text-sm font-medium font-mono text-neutral-900">{j.codigo}</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {j.quadra.cemiterio.nome} — Quadra {j.quadra.codigo} · {j.status}
            </p>
          </button>
        ))}
      </div>
    );
  }

  // ── Step: Detalhes ────────────────────────────────────────────────────────
  if (step === 'detalhes') {
    const backStep: Step = tipo === 'TRANSLADO' ? 'destino' : 'jazigo';
    return (
      <div className="space-y-4">
        <StepHeader tipo={tipo!} step={tipo === 'TRANSLADO' ? 4 : 3} label="Dados da operação" onBack={() => setStep(backStep)} />
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Data do evento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dataEvento}
                onChange={(e) => setForm((p) => ({ ...p, dataEvento: e.target.value }))}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Autorizado por <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.autorizadoPor}
                onChange={(e) => setForm((p) => ({ ...p, autorizadoPor: e.target.value }))}
                placeholder="Nome do responsável"
                maxLength={200}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Funerária</label>
              <input
                type="text"
                value={form.funeraria}
                onChange={(e) => setForm((p) => ({ ...p, funeraria: e.target.value }))}
                maxLength={200}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Responsável familiar</label>
              <input
                type="text"
                value={form.responsavelNome}
                onChange={(e) => setForm((p) => ({ ...p, responsavelNome: e.target.value }))}
                maxLength={200}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => setStep('confirmar')}
            disabled={!form.dataEvento || !form.autorizadoPor}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Revisar e confirmar <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Confirmar ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <StepHeader tipo={tipo!} step={tipo === 'TRANSLADO' ? 5 : 4} label="Confirmar operação" onBack={() => setStep('detalhes')} />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
        <Row label="Tipo" value={typeConfig.label} />
        <Row label="Falecido" value={falecido!.nomeCompleto} />
        {tipo === 'TRANSLADO' ? (
          <>
            <Row label="Origem" value={`${jazigo!.codigo} — ${jazigo!.quadra.cemiterio.nome}`} />
            <Row label="Destino" value={`${jazigoDestino!.codigo} — ${jazigoDestino!.quadra.cemiterio.nome}`} />
          </>
        ) : (
          <Row label="Jazigo" value={`${jazigo!.codigo} — ${jazigo!.quadra.cemiterio.nome}`} />
        )}
        <Row label="Data" value={formatDate(form.dataEvento)} />
        <Row label="Autorizado por" value={form.autorizadoPor} />
        {form.funeraria && <Row label="Funerária" value={form.funeraria} />}
        {form.responsavelNome && <Row label="Resp. familiar" value={form.responsavelNome} />}
        {form.observacoes && <Row label="Observações" value={form.observacoes} />}
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setStep('detalhes')}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50"
        >
          Voltar
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Registrando...' : `Confirmar ${typeConfig.label}`}
        </button>
      </div>
    </div>
  );
}

function StepHeader({ tipo, step, label, onBack }: { tipo: BurialType; step: number; label: string; onBack: () => void }) {
  const total = tipo === 'TRANSLADO' ? 5 : 4;
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="text-xs text-neutral-500 hover:text-neutral-700">← Voltar</button>
      <span className="text-xs text-neutral-400">Etapa {step} de {total}</span>
      <span className="text-sm font-medium text-neutral-900">{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-neutral-900 text-right max-w-xs">{value}</span>
    </div>
  );
}
