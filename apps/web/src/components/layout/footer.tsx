interface FooterProps {
  tenantName?: string | null;
}

export function Footer({ tenantName }: FooterProps) {
  const year = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0';

  return (
    <footer className="h-8 shrink-0 flex items-center justify-center border-t border-neutral-100 bg-white px-6">
      <p className="text-xs text-neutral-400">
        SIGCEM © {year}
        {tenantName && (
          <> · <span className="text-neutral-500 font-medium">{tenantName}</span></>
        )}
        {' '}· v{version}
      </p>
    </footer>
  );
}
