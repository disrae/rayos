'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, LinkIcon } from 'lucide-react';

function extractToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.includes('/')) return trimmed;
  const match = trimmed.match(/\/i\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export default function JoinPage() {
  const router = useRouter();
  const [inviteLinkInput, setInviteLinkInput] = useState('');

  function onJoinWithInvite() {
    const token = extractToken(inviteLinkInput);
    if (!token) {
      toast.error('Please paste a valid invite token or /i/... URL.');
      return;
    }
    router.push(`/i/${token}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Rayos</span>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <LinkIcon className="size-5 text-primary" />
            <h1 className="text-xl font-semibold">Join with invite</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste the invite link or token your project team shared with you.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteLink">Invite link or token</Label>
              <Input
                id="inviteLink"
                value={inviteLinkInput}
                onChange={(e) => setInviteLinkInput(e.target.value)}
                placeholder="https://app.rayos.com/i/abc123 or abc123"
              />
            </div>
            <Button onClick={onJoinWithInvite} className="w-full">
              Continue with invite
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
