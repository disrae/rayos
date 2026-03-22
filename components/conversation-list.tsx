'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface ConversationItem {
  id: string;
  label: string;
  preview?: string | null;
  status?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  className,
}: {
  conversations: ConversationItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  if (conversations.length === 0) {
    return (
      <p className={cn('py-6 text-center text-sm text-muted-foreground', className)}>
        No conversations yet.
      </p>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      {conversations.map((convo) => (
        <button
          key={convo.id}
          onClick={() => onSelect(convo.id)}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
            selectedId === convo.id
              ? 'bg-primary/10 text-foreground'
              : 'text-foreground hover:bg-muted',
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-foreground">
              {convo.label[0]?.toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{convo.label}</p>
            {convo.preview !== undefined && (
              <p className="truncate text-xs text-muted-foreground">
                {convo.preview || 'No messages yet'}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
