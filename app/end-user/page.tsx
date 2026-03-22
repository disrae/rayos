'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell, AppShellBody, AppShellSidebar, AppShellMain } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { ConversationList, type ConversationItem } from '@/components/conversation-list';
import { ChatBubble } from '@/components/chat-bubble';
import { ChatComposer } from '@/components/chat-composer';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, LinkIcon } from 'lucide-react';

export default function EndUserDashboardPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const attemptedAuthRefreshRef = useRef(false);
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');
  const sendEndUserMessage = useMutation(api.rayos.sendEndUserMessage);

  const dashboard = useQuery(api.rayos.listEndUserDashboard, isAuthenticated ? {} : 'skip');
  const [selectedConversationIdState, setSelectedConversationIdState] = useState<Id<'conversations'> | null>(
    initialConversationId as Id<'conversations'> | null,
  );

  const selectedConversationId = selectedConversationIdState ?? dashboard?.conversations[0]?._id ?? null;

  const messages = useQuery(
    api.rayos.getConversationMessagesForEndUser,
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
        label: c.subject ?? 'Project chat',
        preview: c.status,
      })) ?? [],
    [dashboard?.conversations],
  );

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !attemptedAuthRefreshRef.current) {
      attemptedAuthRefreshRef.current = true;
      router.refresh();
    }
  }, [isAuthLoading, isAuthenticated, router]);

  async function onSendMessage(body: string) {
    if (!selectedConversationId) return;
    await sendEndUserMessage({ conversationId: selectedConversationId, body });
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
              description="Please sign in again to open your chats."
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

  // Not linked
  if (dashboard === null) {
    return (
      <AppShell>
        <PageHeader />
        <AppShellBody>
          <AppShellMain className="items-center justify-center">
            <EmptyState
              icon={<LinkIcon className="size-10" />}
              heading="No end-user profile yet"
              description="Join with an invite link from a business to access your chats."
              action={
                <Button variant="outline" asChild>
                  <Link href="/start">Enter invite link</Link>
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
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="truncate text-sm font-medium">{dashboard.endUser.email}</p>
            </div>

            <Separator />

            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Your Chats</h2>
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
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold">{selectedConversation.subject ?? 'Project chat'}</h2>
                  <Badge variant="outline" className="text-xs capitalize">{selectedConversation.status}</Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-surface p-6">
                {messages?.map((msg) => (
                  <ChatBubble
                    key={msg._id}
                    sender={msg.senderType === 'endUser' ? 'self' : msg.senderType === 'system' ? 'system' : 'other'}
                  >
                    {msg.body}
                  </ChatBubble>
                ))}
                {messages && messages.length === 0 && (
                  <EmptyState
                    icon={<MessageSquare className="size-8" />}
                    heading="No messages yet"
                    description="Send a message to start the conversation."
                  />
                )}
              </div>

              {/* Composer */}
              <ChatComposer onSend={onSendMessage} placeholder="Write your message..." />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="size-10" />}
                heading="No chats yet"
                description="Join a business intake link to start chatting."
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/start">Join with invite</Link>
                  </Button>
                }
              />
            </div>
          )}
        </AppShellMain>
      </AppShellBody>
    </AppShell>
  );
}
