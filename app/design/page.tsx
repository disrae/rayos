'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChatBubble } from '@/components/chat-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { ConversationList } from '@/components/conversation-list';
import { EmptyState } from '@/components/empty-state';
import { IntakeLinkCard } from '@/components/intake-link-card';
import { StatusBadge } from '@/components/status-badge';
import { toast } from 'sonner';
import {
  Copy,
  MessageSquare,
  Link as LinkIcon,
  Sun,
  Trash2,
  Plus,
  Info,
} from 'lucide-react';
import Image from 'next/image';

/* ─── Section wrapper ─── */
function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ─── Color swatch ─── */
function Swatch({ name, cssVar, hex }: { name: string; cssVar: string; hex: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="size-16 rounded-xl shadow-sm" style={{ background: `var(${cssVar})` }} />
      <div className="text-center">
        <p className="text-xs font-medium">{name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{hex}</p>
      </div>
    </div>
  );
}

export default function DesignPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-card px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3">
            <Image src="/rayos-bolts.svg" alt="Rayos" width={32} height={32} />
            <h1 className="text-3xl font-bold tracking-tight">Rayos Design System</h1>
          </div>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            A living reference of colors, typography, and components for Rayos.
            The brand feels like clear morning light: warm, calm, and trustworthy.
            Sky-blue primary for trust and clarity. Warm amber accent for a nod to
            &ldquo;rayos&rdquo; (rays of sunlight). Slate neutrals for text and structure.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        {/* ── 1. Colors ── */}
        <Section title="Colors" description="Core palette derived from CSS custom properties. Sky-blue primary, warm amber accent, slate neutrals, and semantic colors for status feedback.">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Primary &amp; Accent</h3>
              <div className="flex flex-wrap gap-4">
                <Swatch name="Primary" cssVar="--primary" hex="#0ea5e9" />
                <Swatch name="Primary FG" cssVar="--primary-foreground" hex="#f8fafc" />
                <Swatch name="Accent" cssVar="--accent" hex="#fef3c7" />
                <Swatch name="Accent FG" cssVar="--accent-foreground" hex="#92400e" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Surfaces</h3>
              <div className="flex flex-wrap gap-4">
                <Swatch name="Background" cssVar="--background" hex="#f8fafc" />
                <Swatch name="Foreground" cssVar="--foreground" hex="#0f172a" />
                <Swatch name="Card" cssVar="--card" hex="#ffffff" />
                <Swatch name="Muted" cssVar="--muted" hex="#f1f5f9" />
                <Swatch name="Muted FG" cssVar="--muted-foreground" hex="#64748b" />
                <Swatch name="Surface" cssVar="--surface" hex="#f1f5f9" />
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">Borders &amp; Semantic</h3>
              <div className="flex flex-wrap gap-4">
                <Swatch name="Border" cssVar="--border" hex="#e2e8f0" />
                <Swatch name="Ring" cssVar="--ring" hex="#0ea5e9" />
                <Swatch name="Destructive" cssVar="--destructive" hex="#ef4444" />
                <Swatch name="Success" cssVar="--success" hex="#10b981" />
                <Swatch name="Warning" cssVar="--warning" hex="#f59e0b" />
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 2. Typography ── */}
        <Section title="Typography" description="Geist Sans for all text. Clean, geometric, highly legible at all sizes.">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-3xl / font-bold</p>
              <p className="text-3xl font-bold tracking-tight">Page Heading</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-2xl / font-semibold</p>
              <p className="text-2xl font-semibold tracking-tight">Section Heading</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-xl / font-semibold</p>
              <p className="text-xl font-semibold">Card Title</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-lg / font-medium</p>
              <p className="text-lg font-medium">Subheading</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-base</p>
              <p className="text-base">Body text. Rayos helps businesses and their customers stay aligned through clear project conversations.</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-sm</p>
              <p className="text-sm text-muted-foreground">Secondary text and descriptions, used for supporting content and metadata.</p>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted-foreground">text-xs / font-mono</p>
              <p className="font-mono text-xs text-muted-foreground">Monospace caption — tokens, IDs, timestamps</p>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 3. Buttons ── */}
        <Section title="Buttons" description="Variants: default (primary), secondary, outline, ghost, destructive, link. Sizes: xs, sm, default, lg, icon.">
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Variants</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus className="size-4" /></Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">With Icons</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button><Plus className="size-4" /> New Link</Button>
                <Button variant="outline"><Copy className="size-4" /> Copy</Button>
                <Button variant="destructive"><Trash2 className="size-4" /> Delete</Button>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Disabled</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Primary</Button>
                <Button variant="outline" disabled>Outline</Button>
                <Button variant="destructive" disabled>Destructive</Button>
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 4. Inputs ── */}
        <Section title="Inputs" description="Text fields with label, placeholder, error state, and textarea.">
          <div className="grid max-w-xl gap-6 rounded-xl border border-border bg-card p-6">
            <div className="space-y-2">
              <Label htmlFor="demo-name">Your name</Label>
              <Input id="demo-name" placeholder="Alex Rivera" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input id="demo-email" type="email" placeholder="alex@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-error">With error</Label>
              <Input id="demo-error" defaultValue="bad@" aria-invalid="true" />
              <p className="text-sm text-destructive">Please enter a valid email address.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-disabled">Disabled</Label>
              <Input id="demo-disabled" placeholder="Cannot edit" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-textarea">Message</Label>
              <Textarea id="demo-textarea" placeholder="Write your message here..." rows={3} />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 5. Cards ── */}
        <Section title="Cards" description="Content containers with rounded-xl border. Used for panels, forms, and content grouping.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Basic Card</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A simple content container with border and shadow.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Card with Action</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cards can contain any content including buttons.
              </p>
              <Button size="sm" className="mt-4">Take Action</Button>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 6. Badges ── */}
        <Section title="Badges &amp; Status" description="Status indicators using Badge primitives and the StatusBadge component for domain-specific states.">
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Badge variants</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">StatusBadge (domain-specific)</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="active" />
                <StatusBadge status="disabled" />
                <StatusBadge status="open" />
                <StatusBadge status="closed" />
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 7. Avatars ── */}
        <Section title="Avatars" description="User representations with initials fallback. Used in conversation lists, page headers, and chat.">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-6">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">AR</AvatarFallback>
            </Avatar>
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">JD</AvatarFallback>
            </Avatar>
            <Avatar className="size-12">
              <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">MK</AvatarFallback>
            </Avatar>
            <Avatar className="size-14">
              <AvatarFallback className="bg-destructive/10 text-base font-semibold text-destructive">!</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        <Separator />

        {/* ── 8. Dialog ── */}
        <Section title="Dialog" description="Modal overlay for confirmations and focused interactions. Replaces window.confirm() with a branded, accessible experience.">
          <div className="rounded-xl border border-border bg-card p-6">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Trash2 className="size-4" /> Delete end user</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete this end user?</DialogTitle>
                  <DialogDescription>
                    They will lose access to this workspace. Existing chat history will be preserved for project records.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={() => { setDialogOpen(false); toast.success('End user deleted (demo)'); }}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </Section>

        <Separator />

        {/* ── 9. Tooltip ── */}
        <Section title="Tooltip" description="Small hover hints for icon buttons and truncated text.">
          <div className="flex gap-4 rounded-xl border border-border bg-card p-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon"><Copy className="size-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>Copy to clipboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon"><Info className="size-4" /></Button>
              </TooltipTrigger>
              <TooltipContent>More information</TooltipContent>
            </Tooltip>
          </div>
        </Section>

        <Separator />

        {/* ── 10. Chat Bubbles ── */}
        <Section title="Chat Bubbles" description="Message display for conversations. Three sender types: self (primary blue), other (card white), and system (centered muted).">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-6">
            <ChatBubble sender="other">Hi, I have a question about the renovation timeline.</ChatBubble>
            <ChatBubble sender="self">Sure! We're currently on track for the March deadline. I'll send the updated schedule today.</ChatBubble>
            <ChatBubble sender="system">Alex Rivera joined the conversation</ChatBubble>
            <ChatBubble sender="other">Great, thanks for the quick response.</ChatBubble>
            <ChatBubble sender="self">No problem. Let me know if anything else comes up.</ChatBubble>
          </div>
        </Section>

        <Separator />

        {/* ── 11. Chat Composer ── */}
        <Section title="Chat Composer" description="Message input with Enter-to-send. Shift+Enter for newlines.">
          <div className="overflow-hidden rounded-xl border border-border">
            <ChatComposer
              onSend={(body) => { toast.info(`Message sent (demo): "${body}"`); }}
              placeholder="Try typing a message..."
            />
          </div>
        </Section>

        <Separator />

        {/* ── 12. Conversation List ── */}
        <Section title="Conversation List" description="Sidebar component for navigating between chat threads. Used in both member and end-user dashboards.">
          <div className="max-w-sm rounded-xl border border-border bg-card p-4">
            <ConversationList
              conversations={[
                { id: '1', label: 'Maria Gonzalez', preview: 'Thanks for the update!' },
                { id: '2', label: 'James Chen', preview: 'When can we schedule the walkthrough?' },
                { id: '3', label: 'Sarah Kim', preview: null },
              ]}
              selectedId="1"
              onSelect={(id) => toast.info(`Selected conversation ${id}`)}
            />
          </div>
        </Section>

        <Separator />

        {/* ── 13. Intake Link Card ── */}
        <Section title="Intake Link Card" description="Displays an intake link with copy and disable actions. Used in the member dashboard.">
          <div className="max-w-xl space-y-3">
            <IntakeLinkCard token="abc123-def456" status="active" onDisable={() => toast.info('Disabled (demo)')} />
            <IntakeLinkCard token="old-link-789" status="disabled" />
          </div>
        </Section>

        <Separator />

        {/* ── 14. Empty State ── */}
        <Section title="Empty State" description="Placeholder for lists with no items. Includes icon, heading, description, and optional action.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={<MessageSquare className="size-10" />}
                heading="No conversations yet"
                description="Start a conversation by sharing an intake link with a customer."
                action={<Button size="sm"><Plus className="size-4" /> New Link</Button>}
              />
            </div>
            <div className="rounded-xl border border-border bg-card">
              <EmptyState
                icon={<LinkIcon className="size-10" />}
                heading="No intake links"
                description="Create your first link to start accepting end users."
              />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 15. Skeletons ── */}
        <Section title="Loading Skeletons" description="Animated placeholders shown while data loads. Replace plain 'Loading...' text.">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Conversation list skeleton</p>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Card skeleton</p>
              <Skeleton className="h-24 w-full rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── 16. Toasts ── */}
        <Section title="Toasts" description="Non-blocking notifications for success, error, and informational messages. Powered by Sonner.">
          <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-6">
            <Button variant="outline" onClick={() => toast.success('Action completed successfully.')}>
              <Sun className="size-4" /> Success Toast
            </Button>
            <Button variant="outline" onClick={() => toast.error('Something went wrong. Please try again.')}>
              Error Toast
            </Button>
            <Button variant="outline" onClick={() => toast.info('Your changes have been saved.')}>
              Info Toast
            </Button>
            <Button variant="outline" onClick={() => toast.warning('This action cannot be undone.')}>
              Warning Toast
            </Button>
          </div>
        </Section>

        {/* Footer */}
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>Rayos Design System &middot; Built with shadcn/ui, Radix, and Tailwind CSS v4</p>
        </div>
      </div>
    </div>
  );
}
