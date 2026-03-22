'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useMutation } from 'convex/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const deleteMyAccount = useMutation(api.rayos.deleteMyAccount);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onDeleteMyAccount() {
    const confirmed = window.confirm(
      'Delete your end-user account from this workspace?\n\nYou will lose access, but existing chat history may be kept for project records.',
    );
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteMyAccount({});
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete account. Please try again.';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-sky-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/rayos-bolts.svg" alt="Rayos logo" width={32} height={32} />
            <p className="text-xl font-semibold">Rayos</p>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  void onDeleteMyAccount();
                }}
                disabled={isDeleting}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
              <button
                onClick={() => {
                  void signOut();
                }}
                className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </header>

        <section className="rounded-2xl border border-sky-100 bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight">Calm customer chat for project teams</h1>
          <p className="mt-4 max-w-2xl text-slate-600">
            Rayos helps businesses and their end users stay aligned through clear project conversations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/start" className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-white">
                  Continue to Rayos
                </Link>
              </>
            ) : (
              <>
                <a href="/sign-in" className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-white">
                  Sign in
                </a>
                <a href="/sign-up" className="rounded-lg border border-sky-200 bg-white px-4 py-2 font-medium">
                  Sign up
                </a>
              </>
            )}
          </div>
          {deleteError ? <p className="mt-3 text-sm text-red-600">{deleteError}</p> : null}
        </section>
      </div>
    </main>
  );
}
