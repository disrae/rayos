'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, LinkIcon, ArrowRight } from 'lucide-react';

function extractToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.includes('/')) return trimmed;
  const match = trimmed.match(/\/i\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export default function StartPage() {
  const router = useRouter();
  const actorState = useQuery(api.rayos.getActorState, {});

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [inviteLinkInput, setInviteLinkInput] = useState('');

  const needsRedirectToDashboard = !!actorState?.hasMemberProfile;
  const needsRedirectToEndUser = !!actorState?.hasEndUserProfile;

  useEffect(() => {
    if (needsRedirectToDashboard) {
      router.replace('/dashboard');
    } else if (needsRedirectToEndUser) {
      router.replace('/end-user');
    }
  }, [needsRedirectToDashboard, needsRedirectToEndUser, router]);

  if (!actorState || needsRedirectToDashboard || needsRedirectToEndUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-5xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  function onContinueToPricing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ fullName, businessName });
    router.push(`/start/pricing?${params.toString()}`);
  }

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
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Rayos</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Business signup */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-primary" />
              <h1 className="text-xl font-semibold">Set up your workspace</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a workspace, then share invite links with your customers.
            </p>

            <form onSubmit={onContinueToPricing} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Your name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Rayos Construction"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </div>

          {/* Join with invite */}
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
              <Button variant="outline" onClick={onJoinWithInvite} className="w-full">
                Continue with invite
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
