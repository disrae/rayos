import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-success/15 text-success border-success/25' },
  disabled: { label: 'Disabled', className: 'bg-muted text-muted-foreground border-border' },
  open: { label: 'Open', className: 'bg-primary/10 text-primary border-primary/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
