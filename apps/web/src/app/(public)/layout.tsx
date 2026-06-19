export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900">SIGCEM</p>
            <p className="text-xs text-neutral-500">Portal público de consulta</p>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      <footer className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-neutral-400">
        Sistema de Gestão de Cemitérios Municipais — SIGCEM · Dados públicos
      </footer>
    </div>
  );
}
