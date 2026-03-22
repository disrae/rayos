import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  heading,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  heading: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{heading}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
