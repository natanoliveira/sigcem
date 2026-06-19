import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionProvider } from '@/components/providers/session-provider';
import { SidebarProvider } from '@/components/providers/sidebar-provider';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { Footer } from '@/components/layout/footer';
import { LogoutButton } from '@/components/layout/logout-button';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const tenantName = (session as any)?.tenantName ?? null;

  return (
    <SessionProvider>
      <SidebarProvider>
        <div className="min-h-screen flex flex-col bg-neutral-50">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
              <Footer tenantName={tenantName} />
            </div>
          </div>
        </div>
        <LogoutButton />
      </SidebarProvider>
    </SessionProvider>
  );
}
