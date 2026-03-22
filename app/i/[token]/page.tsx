'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowRight, LogIn, UserPlus } from 'lucide-react';

export default function IntakePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intakeBusiness = useQuery(api.rayos.getIntakeBusiness, { token });
  const claimIntakeLink = useMutation(api.rayos.claimIntakeLink);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const chosenEmail = (email || user?.email || '').trim();
      const result = await claimIntakeLink({ token, email: chosenEmail, name: name.trim() || undefined });
      router.push(`/end-user?conversationId=${result.conversationId}`);
    } catch (submissionError) {
      toast.error(submissionError instanceof Error ? submissionError.message : 'Unable to join this business right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={36} height={36} />
          {intakeBusiness === undefined ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold tracking-tight">
              {intakeBusiness ? `Join ${intakeBusiness.businessName}` : 'Join project chat'}
            </h1>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {!user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in or create an account to join this conversation. We will connect your account to this business.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <a href="/sign-in">
                    <LogIn className="size-4" />
                    Sign in
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/sign-up">
                    <UserPlus className="size-4" />
                    Create account
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Confirm your email and optionally add your name to join the chat.
              </p>
              <Separator className="my-4" />
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email || user?.email || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting || intakeBusiness === null} className="w-full">
                  {isSubmitting ? 'Joining...' : 'Join chat'}
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
