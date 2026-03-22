'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Users, MessageSquare } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For solo operators getting started.',
    users: '1 client user',
    features: ['1 workspace', '1 end-user client', 'Unlimited messages', 'File sharing'],
  },
  {
    id: 'startup',
    name: 'Startup',
    price: '$100',
    period: '/mo',
    description: 'For growing teams with multiple clients.',
    users: 'Up to 10 client users',
    highlight: true,
    features: [
      'Everything in Free',
      'Up to 10 end-user clients',
      'Priority support',
      'Team collaboration',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$850',
    period: '/mo',
    description: 'For established businesses at scale.',
    users: 'Up to 100 client users',
    features: [
      'Everything in Startup',
      'Up to 100 end-user clients',
      'Dedicated support',
      'Advanced analytics',
    ],
  },
] as const;

type PlanId = (typeof plans)[number]['id'];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fullName = searchParams.get('fullName') ?? '';
  const businessName = searchParams.get('businessName') ?? '';

  const actorState = useQuery(api.rayos.getActorState, {});
  const createBusinessAccount = useMutation(api.rayos.createBusinessAccount);

  const [busy, setBusy] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  const needsRedirectToStart = !fullName || !businessName;
  const needsRedirectToDashboard = !needsRedirectToStart && !!actorState?.hasMemberProfile;

  useEffect(() => {
    if (needsRedirectToStart) {
      router.replace('/start');
    } else if (needsRedirectToDashboard) {
      router.replace('/dashboard');
    }
  }, [needsRedirectToStart, needsRedirectToDashboard, router]);

  if (needsRedirectToStart || needsRedirectToDashboard || !actorState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-4xl">
          <Skeleton className="mx-auto mb-8 h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  async function onSelectPlan(planId: PlanId) {
    setSelectedPlan(planId);
    setBusy(true);
    try {
      await createBusinessAccount({ fullName, businessName, plan: planId });
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to create business account.');
      setBusy(false);
      setSelectedPlan(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Image src="/rayos-bolts.svg" alt="Rayos" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Rayos</span>
        </div>

        <div className="mb-2 text-center">
          <h1 className="text-2xl font-semibold">Choose your plan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick the plan that fits <span className="font-medium text-foreground">{businessName}</span>. You can change it anytime.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isHighlighted = 'highlight' in plan && plan.highlight;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-6 shadow-sm transition-all ${
                  isHighlighted
                    ? 'border-primary bg-primary/[0.03] ring-1 ring-primary/20'
                    : 'border-border bg-card'
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Most popular
                  </span>
                )}

                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <div className="mb-5 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium">
                  <Users className="size-4 text-muted-foreground" />
                  {plan.users}
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={busy}
                  variant={isHighlighted ? 'default' : 'outline'}
                  className="w-full"
                >
                  {isSelected && busy ? 'Setting up...' : 'Get started'}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need more than 100 users?{' '}
            <button
              type="button"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4 hover:text-primary"
              onClick={() => {
                toast.info('Custom pricing inquiries are not yet available. Please choose a plan above for now.');
              }}
            >
              <MessageSquare className="size-3.5" />
              Contact us for custom pricing
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
