import Image from 'next/image';
import Link from 'next/link';
import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function SignInPage() {
  const authUrl = await getSignInUrl();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={40} height={40} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to pick up where you left off.
          </p>
        </div>

        <Button asChild className="w-full" size="lg">
          <a href={authUrl}>
            Continue to sign in
            <ArrowRight className="size-4" />
          </a>
        </Button>

        <p className="text-sm text-muted-foreground">
          Don&rsquo;t have an account?{' '}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
