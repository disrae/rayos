'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export default function IntakePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intakeBusiness = useQuery(api.rayos.getIntakeBusiness, { token });
  const claimIntakeLink = useMutation(api.rayos.claimIntakeLink);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const chosenEmail = (email || user?.email || '').trim();
      const result = await claimIntakeLink({ token, email: chosenEmail, name: name.trim() || undefined });
      router.push(`/end-user?conversationId=${result.conversationId}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to join this business right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
      <section className="w-full max-w-lg rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {intakeBusiness ? `Join ${intakeBusiness.businessName}` : 'Join project chat'}
        </h1>
        {!user ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Sign in or sign up to join this conversation. We will connect your account to this business.
            </p>
            <div className="mt-6 flex gap-2">
              <a href="/sign-in" className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white">
                Sign in
              </a>
              <a href="/sign-up" className="rounded-lg border border-sky-200 px-4 py-2 text-sm font-medium text-slate-700">
                Sign up
              </a>
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            You are signed in. Confirm your email and optionally add your name to join this chat.
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email || user?.email || ''}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name (optional)
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
            />
          </div>

          {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || intakeBusiness === null || !user}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Joining...' : 'Join chat'}
          </button>
        </form>
      </section>
    </main>
  );
}
