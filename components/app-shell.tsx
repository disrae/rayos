import { cn } from '@/lib/utils';

export function AppShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex h-screen flex-col overflow-hidden', className)}>{children}</div>;
}

export function AppShellBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex min-h-0 flex-1', className)}>{children}</div>;
}

export function AppShellSidebar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        'hidden w-80 shrink-0 overflow-y-auto border-r border-border bg-card p-4 md:block',
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function AppShellMain({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <main className={cn('flex min-w-0 flex-1 flex-col', className)}>{children}</main>;
}
