'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    await signIn('keycloak', { callbackUrl: '/dashboard' });
  }

  return (
    <div className="min-h-screen bg-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col items-center gap-8">

        {/* Logo e título */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">SIGCEM</h1>
          <p className="text-sm text-neutral-700 leading-relaxed">
            Sistema Integrado de Gestão de<br />Cemitérios e Serviços Funerários
          </p>
        </div>

        {/* Botão de login */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {loading ? 'Redirecionando...' : 'Entrar com conta institucional'}
        </button>

        <p className="text-xs text-neutral-700 text-center">
          O acesso é restrito a servidores municipais autorizados.
        </p>
      </div>
    </div>
  );
}
