import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIGCEM',
  description: 'Sistema Integrado de Gestão de Cemitérios e Serviços Funerários',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
