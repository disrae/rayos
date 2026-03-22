'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatComposer({
  onSend,
  placeholder = 'Write a message...',
  disabled = false,
  className,
}: {
  onSend: (body: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setBody('');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-end gap-2 border-t border-border bg-card p-4', className)}>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || sending}
        rows={1}
        className="min-h-10 max-h-32 flex-1 resize-none"
      />
      <Button type="submit" size="icon" disabled={disabled || sending || !body.trim()}>
        <SendHorizonal className="size-4" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
