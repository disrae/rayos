'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useMutation } from 'convex/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowRight, MessageSquare, Building2, Zap } from 'lucide-react';

export default function HomePage() {
  const { user, signOut } = useAuth();
  const deleteMyAccount = useMutation(api.rayos.deleteMyAccount);
  const [isDeleting, setIsDeleting] = useState(false);

  async function onDeleteMyAccount() {
    setIsDeleting(true);
    try {
      await deleteMyAccount({});
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete account. Please try again.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Rayos</span>
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This will remove your end-user account from this workspace. You will lose access, but existing chat history may be kept for project records.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={() => { void onDeleteMyAccount(); }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete account'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { void signOut(); }}
            >
              Sign out
            </Button>
          </div>
        ) : null}
      </header>

      {/* Hero */}
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-16 px-6 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Keep your customers<br />in the light.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            One focused conversation per customer. No email chains, no missed updates, no lost context.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {user ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Continue to Rayos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/sign-in">
                    Sign in
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </section>

        {/* Value props */}
        <section className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <MessageSquare className="size-8 text-primary" />
            <h3 className="mt-3 font-semibold">One thread, one customer</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Every customer gets a dedicated conversation. Nothing gets buried, nothing gets crossed.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Building2 className="size-8 text-primary" />
            <h3 className="mt-3 font-semibold">Built for project work</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Construction, renovation, design, consulting -- if you deliver projects, Rayos keeps your customers close.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <Zap className="size-8 text-primary" />
            <h3 className="mt-3 font-semibold">Real-time, always</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Messages arrive instantly. No refreshing, no waiting.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
