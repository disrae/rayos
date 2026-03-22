import Image from 'next/image';
import Link from 'next/link';
import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function SignUpPage() {
  const authUrl = await getSignUpUrl();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={40} height={40} />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Start with Rayos</h1>
          <p className="text-sm text-muted-foreground">
            Create an account to bring clarity to your project conversations.
          </p>
        </div>

        <Button asChild className="w-full" size="lg">
          <a href={authUrl}>
            Create account
            <ArrowRight className="size-4" />
          </a>
        </Button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
