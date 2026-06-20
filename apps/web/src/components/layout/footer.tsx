interface FooterProps {
  tenantName?: string | null;
}

export function Footer({ tenantName }: FooterProps) {
  const year = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '3.0.0';

  return (
    <footer className="h-8 shrink-0 flex items-center justify-center border-t border-border bg-card px-6">
      <p className="text-xs text-muted-foreground">
        SIGCEM © {year}
        {tenantName && (
          <> · <span className="text-foreground/70 font-medium">{tenantName}</span></>
        )}
        {' '}· v{version}
      </p>
    </footer>
  );
}
