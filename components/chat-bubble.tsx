import { cn } from '@/lib/utils';

export type ChatBubbleSender = 'self' | 'other' | 'system';

export function ChatBubble({
  sender,
  children,
  className,
}: {
  sender: ChatBubbleSender;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
        sender === 'self' && 'ml-auto bg-primary text-primary-foreground',
        sender === 'other' && 'mr-auto bg-card text-card-foreground shadow-sm',
        sender === 'system' && 'mx-auto text-center text-xs text-muted-foreground italic',
        className,
      )}
    >
      {children}
    </div>
  );
}
