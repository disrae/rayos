'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { completeSignUpWithVerificationCode, signUpWithPassword } from '@/app/auth-actions';

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(signUpWithPassword, undefined);
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    completeSignUpWithVerificationCode,
    undefined,
  );
  const intent = searchParams.get('intent');
  const inviteToken = searchParams.get('inviteToken');
  const isInviteSignup = intent === 'end-user' && !!inviteToken;
  const showVerificationStep = !!state?.needsEmailVerification && !!state.pendingAuthenticationToken;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={40} height={40} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isInviteSignup ? 'Create your account to join' : 'Create your business workspace'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isInviteSignup
              ? 'You are joining through a business invite link.'
              : 'Business accounts only. Invite your customers after setup.'}
          </p>
        </div>

        {showVerificationStep ? (
          <form action={verifyFormAction} className="space-y-4">
            <input type="hidden" name="email" value={state.email ?? ''} />
            <input
              type="hidden"
              name="pendingAuthenticationToken"
              value={state.pendingAuthenticationToken ?? ''}
            />
            <input type="hidden" name="firstName" value={state.firstName ?? ''} />
            <input type="hidden" name="lastName" value={state.lastName ?? ''} />
            <input type="hidden" name="businessName" value={state.businessName ?? ''} />
            <input type="hidden" name="intent" value={state.intent ?? ''} />
            <input type="hidden" name="inviteToken" value={state.inviteToken ?? ''} />

            {state.email ? (
              <p className="text-xs text-muted-foreground">
                We sent a verification code to <span className="font-medium text-foreground">{state.email}</span>.
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                required
                placeholder="Enter code"
              />
            </div>

            {(verifyState?.error || state?.error) && (
              <p className="text-sm text-destructive">{verifyState?.error ?? state?.error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={verifyPending}>
              {verifyPending ? 'Verifying…' : 'Verify and continue'}
            </Button>
          </form>
        ) : (
          <form action={formAction} className="space-y-4">
            {isInviteSignup && (
              <>
                <input type="hidden" name="intent" value="end-user" />
                <input type="hidden" name="inviteToken" value={inviteToken} />
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            {!isInviteSignup && (
              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  autoComplete="organization"
                  required
                  placeholder="Rayos Construction"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={pending}>
              {pending
                ? 'Creating account…'
                : isInviteSignup
                  ? 'Create account and continue'
                  : 'Create business account'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
