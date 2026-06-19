import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-700 mt-1">
          Bem-vindo, {session?.user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cemitérios', value: '—', desc: 'cadastrados' },
          { label: 'Jazigos', value: '—', desc: 'disponíveis' },
          { label: 'Sepultamentos', value: '—', desc: 'este mês' },
          { label: 'Documentos', value: '—', desc: 'emitidos' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-1"
          >
            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
              {card.label}
            </span>
            <span className="text-3xl font-bold text-neutral-900">{card.value}</span>
            <span className="text-xs text-neutral-700">{card.desc}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">Status do sistema</h2>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          Autenticação operacional — Keycloak conectado
        </div>
      </div>
    </div>
  );
}
