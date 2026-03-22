'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell, AppShellBody, AppShellSidebar, AppShellMain } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ConversationList, type ConversationItem } from '@/components/conversation-list';
import { ChatBubble } from '@/components/chat-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { EmptyState } from '@/components/empty-state';
import { IntakeLinkCard } from '@/components/intake-link-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { Plus, MessageSquare, Trash2, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const attemptedAuthRefreshRef = useRef(false);
  const createIntakeLink = useMutation(api.rayos.createIntakeLink);
  const disableIntakeLink = useMutation(api.rayos.disableIntakeLink);
  const sendMemberMessage = useMutation(api.rayos.sendMemberMessage);
  const deleteEndUser = useMutation(api.rayos.deleteEndUser);

  const [selectedConversationIdState, setSelectedConversationIdState] = useState<Id<'conversations'> | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const dashboard = useQuery(api.rayos.getMemberDashboard, isAuthenticated ? {} : 'skip');

  const selectedConversationId = useMemo(() => {
    if (!dashboard) return null;
    if (selectedConversationIdState) {
      const exists = dashboard.conversations.some((c) => c._id === selectedConversationIdState);
      if (exists) return selectedConversationIdState;
    }
    return dashboard.conversations[0]?._id ?? null;
  }, [dashboard, selectedConversationIdState]);

  const messages = useQuery(
    api.rayos.getConversationMessagesForMember,
    selectedConversationId ? { conversationId: selectedConversationId } : 'skip',
  );

  const selectedConversation = useMemo(
    () => dashboard?.conversations.find((c) => c._id === selectedConversationId) ?? null,
    [dashboard?.conversations, selectedConversationId],
  );

  const conversationItems: ConversationItem[] = useMemo(
    () =>
      dashboard?.conversations.map((c) => ({
        id: c._id,
        label: c.endUserName ?? c.endUserEmail,
        preview: c.lastMessage,
      })) ?? [],
    [dashboard?.conversations],
  );

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !attemptedAuthRefreshRef.current) {
      attemptedAuthRefreshRef.current = true;
      router.refresh();
    }
  }, [isAuthLoading, isAuthenticated, router]);

  async function onCreateIntakeLink() {
    await createIntakeLink({});
    toast.success('Intake link created');
  }

  async function onDisableIntakeLink(id: Id<'intakeLinks'>) {
    await disableIntakeLink({ intakeLinkId: id });
    toast.success('Link disabled');
  }

  async function onSendMessage(body: string) {
    if (!selectedConversationId) return;
    await sendMemberMessage({ conversationId: selectedConversationId, body });
  }

  async function onDeleteEndUser(purgeConversations: boolean) {
    if (!selectedConversation) return;
    setIsDeletingUser(true);
    try {
      await deleteEndUser({
        endUserId: selectedConversation.endUserId,
        purgeConversations,
      });
      toast.success(purgeConversations ? 'User and conversations deleted' : 'User deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete user.');
    } finally {
      setIsDeletingUser(false);
    }
  }

  // Loading state
  if (isAuthLoading || dashboard === undefined) {
    return (
      <AppShell>
        <PageHeader />
        <AppShellBody>
          <AppShellSidebar>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </AppShellSidebar>
          <AppShellMain className="items-center justify-center">
            <Skeleton className="h-12 w-48" />
          </AppShellMain>
        </AppShellBody>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <PageHeader />
        <AppShellBody>
          <AppShellMain className="items-center justify-center">
            <EmptyState
              heading="Sign in required"
              description="Please sign in again to open your dashboard."
              action={
                <Button asChild>
                  <Link href="/sign-in">Go to sign in</Link>
                </Button>
              }
            />
          </AppShellMain>
        </AppShellBody>
      </AppShell>
    );
  }

  // Not onboarded
  if (dashboard === null) {
    return (
      <AppShell>
        <PageHeader />
        <AppShellBody>
          <AppShellMain className="items-center justify-center">
            <EmptyState
              heading="No business profile yet"
              description="Create your business account from sign up before using the dashboard."
              action={
                <Button asChild>
                  <Link href="/sign-up">Go to business sign up</Link>
                </Button>
              }
            />
          </AppShellMain>
        </AppShellBody>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader>
        <Separator orientation="vertical" className="mx-2 h-5" />
        <span className="text-sm text-muted-foreground">{dashboard.business.name}</span>
      </PageHeader>

      <AppShellBody>
        {/* Sidebar */}
        <AppShellSidebar>
          <div className="space-y-6">
            {/* Intake links */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Intake Links</h2>
                <Button size="xs" onClick={() => { void onCreateIntakeLink(); }}>
                  <Plus className="size-3" /> New
                </Button>
              </div>
              {dashboard.intakeLinks.length === 0 ? (
                <p className="text-xs text-muted-foreground">Create an intake link to start accepting customers.</p>
              ) : (
                <div className="space-y-2">
                  {dashboard.intakeLinks.map((link) => (
                    <IntakeLinkCard
                      key={link._id}
                      token={link.token}
                      status={link.status as 'active' | 'disabled'}
                      onDisable={() => { void onDisableIntakeLink(link._id); }}
                    />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Conversations */}
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Conversations</h2>
              <ConversationList
                conversations={conversationItems}
                selectedId={selectedConversationId}
                onSelect={(id) => setSelectedConversationIdState(id as Id<'conversations'>)}
              />
            </div>
          </div>
        </AppShellSidebar>

        {/* Main chat area */}
        <AppShellMain>
          {selectedConversation ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
                <div>
                  <h2 className="text-sm font-semibold">{selectedConversation.endUserName ?? selectedConversation.endUserEmail}</h2>
                  <p className="text-xs text-muted-foreground">{selectedConversation.endUserEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="xs" className="text-destructive">
                        <Trash2 className="size-3" /> Remove user
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove {selectedConversation.endUserName ?? selectedConversation.endUserEmail}?</DialogTitle>
                        <DialogDescription>
                          Choose whether to keep or purge their conversation history.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          variant="secondary"
                          disabled={isDeletingUser}
                          onClick={() => { void onDeleteEndUser(false); }}
                        >
                          {isDeletingUser ? 'Deleting...' : 'Delete (keep chats)'}
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={isDeletingUser}
                          onClick={() => { void onDeleteEndUser(true); }}
                        >
                          <AlertTriangle className="size-3" />
                          {isDeletingUser ? 'Deleting...' : 'Delete + purge'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-6">
                {messages?.map((msg) => (
                  <ChatBubble
                    key={msg._id}
                    sender={msg.senderType === 'member' ? 'self' : msg.senderType === 'system' ? 'system' : 'other'}
                  >
                    {msg.body}
                  </ChatBubble>
                ))}
                {messages && messages.length === 0 && (
                  <EmptyState
                    icon={<MessageSquare className="size-8" />}
                    heading="No messages yet"
                    description="Send the first message to start the conversation."
                  />
                )}
              </div>

              {/* Composer */}
              <ChatComposer onSend={onSendMessage} placeholder="Write a reply..." />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="size-10" />}
                heading="No conversations yet"
                description="Share an intake link with a customer to start chatting."
                action={
                  dashboard.intakeLinks.length === 0 ? (
                    <Button size="sm" onClick={() => { void onCreateIntakeLink(); }}>
                      <Plus className="size-4" /> Create intake link
                    </Button>
                  ) : undefined
                }
              />
            </div>
          )}
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  );
}
