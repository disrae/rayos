'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';

function extractToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!trimmed.includes('/')) {
    return trimmed;
  }
  const match = trimmed.match(/\/i\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export default function StartPage() {
  const router = useRouter();
  const actorState = useQuery(api.rayos.getActorState, {});
  const createBusinessAccount = useMutation(api.rayos.createBusinessAccount);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [pretendPaid, setPretendPaid] = useState(false);
  const [inviteLinkInput, setInviteLinkInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!actorState) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (actorState.hasMemberProfile) {
    router.replace('/dashboard');
    return null;
  }

  if (actorState.hasEndUserProfile) {
    router.replace('/end-user');
    return null;
  }

  async function onCreateBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createBusinessAccount({
        fullName,
        businessName,
        pretendPaid,
      });
      router.push('/dashboard');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create business account.');
    } finally {
      setBusy(false);
    }
  }

  function onJoinWithInvite() {
    const token = extractToken(inviteLinkInput);
    if (!token) {
      setError('Please paste a valid invite token or /i/... URL.');
      return;
    }
    router.push(`/i/${token}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6 py-10">
      <section className="grid w-full max-w-5xl gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Create your business account</h1>
          <p className="mt-2 text-sm text-slate-600">Business owners sign up here, then generate invite links for end users.</p>

          <form onSubmit={onCreateBusiness} className="mt-6 space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Alex Rivera"
                required
                className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="businessName" className="mb-1 block text-sm font-medium text-slate-700">
                Business name
              </label>
              <input
                id="businessName"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Rayos Construction"
                required
                className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={pretendPaid}
                onChange={(event) => setPretendPaid(event.target.checked)}
                className="mt-1"
              />
              <span>I acknowledge that I am pretending to pay $420/month with a two week free trial.</span>
            </label>

            {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? 'Creating account...' : 'Create business account'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Have an invite link?</h2>
          <p className="mt-2 text-sm text-slate-600">
            End users should paste the invite link or token they received from the business.
          </p>
          <div className="mt-6 space-y-3">
            <input
              value={inviteLinkInput}
              onChange={(event) => setInviteLinkInput(event.target.value)}
              placeholder="https://your-app.com/i/abc123 or abc123"
              className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm"
            />
            <button onClick={onJoinWithInvite} className="w-full rounded-lg border border-sky-200 px-4 py-2 text-sm">
              Continue with invite
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
