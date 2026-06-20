'use client';

import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

const BRAND_BULLETS = [
  'Controle total de jazigos e sepultamentos',
  'Certidões digitais com validade legal',
  'Auditoria completa de todas as operações',
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha incorretos.');
      } else {
        router.push('/dashboard');
      }
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Painel de marca (50% — oculto em mobile) ── */}
      <div className="hidden md:flex md:w-1/2 bg-primary-900 flex-col justify-between p-12 select-none">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="SIGCEM" width={36} height={36} className="rounded-lg" unoptimized />
          <span className="text-white font-bold text-xl tracking-wide">SIGCEM</span>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              Sistema Integrado de<br />Gestão de Cemitérios
            </h1>
            <p className="text-primary-300 mt-3 text-base leading-relaxed">
              Plataforma GovTech para administração municipal de cemitérios e serviços funerários.
            </p>
          </div>

          <ul className="space-y-3">
            {BRAND_BULLETS.map((text) => (
              <li key={text} className="flex items-center gap-3 text-primary-200 text-sm">
                <CheckCircle size={16} className="text-primary-400 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-primary-600 text-xs">
          © {new Date().getFullYear()} SIGCEM · Acesso restrito a servidores municipais autorizados
        </p>
      </div>

      {/* ── Painel do formulário (50% em desktop, 100% em mobile) ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-sm">
          {/* Logo visível apenas em mobile */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="SIGCEM" width={32} height={32} className="rounded-lg" unoptimized />
            <span className="font-bold text-neutral-900">SIGCEM</span>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Entrar</h2>
          <p className="text-sm text-neutral-500 mb-8">Acesse sua conta municipal</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@municipio.gov.br"
                className="px-4 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-2.5 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 mt-2"
            >
              {isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-neutral-400 text-center mt-8">
            Acesso restrito a servidores municipais autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
