'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { Copy, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function IntakeLinkCard({
  token,
  status,
  onDisable,
  className,
}: {
  token: string;
  status: 'active' | 'disabled';
  onDisable?: () => void;
  className?: string;
}) {
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const url = `${origin}/i/${token}`;

  function handleCopy() {
    void navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-muted-foreground">{url}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={status} />
        <Button variant="ghost" size="icon-xs" onClick={handleCopy}>
          <Copy className="size-3.5" />
          <span className="sr-only">Copy link</span>
        </Button>
        {status === 'active' && onDisable && (
          <Button variant="ghost" size="icon-xs" onClick={onDisable}>
            <XCircle className="size-3.5 text-destructive" />
            <span className="sr-only">Disable link</span>
          </Button>
        )}
      </div>
    </div>
  );
}
