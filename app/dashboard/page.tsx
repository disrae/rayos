'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';

export default function DashboardPage() {
  const createIntakeLink = useMutation(api.rayos.createIntakeLink);
  const disableIntakeLink = useMutation(api.rayos.disableIntakeLink);
  const sendMemberMessage = useMutation(api.rayos.sendMemberMessage);
  const deleteEndUser = useMutation(api.rayos.deleteEndUser);

  const [selectedConversationIdState, setSelectedConversationIdState] = useState<Id<'conversations'> | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const dashboard = useQuery(api.rayos.getMemberDashboard, {});
  const selectedConversationId = useMemo(() => {
    if (!dashboard) {
      return null;
    }
    if (selectedConversationIdState) {
      const selectedStillExists = dashboard.conversations.some(
        (conversation) => conversation._id === selectedConversationIdState,
      );
      if (selectedStillExists) {
        return selectedConversationIdState;
      }
    }
    return dashboard.conversations[0]?._id ?? null;
  }, [dashboard, selectedConversationIdState]);

  const messages = useQuery(
    api.rayos.getConversationMessagesForMember,
    selectedConversationId ? { conversationId: selectedConversationId } : 'skip',
  );

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) {
      return null;
    }
    return dashboard?.conversations.find((conversation) => conversation._id === selectedConversationId) ?? null;
  }, [dashboard?.conversations, selectedConversationId]);

  async function onCreateIntakeLink() {
    await createIntakeLink({});
  }

  async function onDisableIntakeLink(intakeLinkId: Id<'intakeLinks'>) {
    await disableIntakeLink({ intakeLinkId });
  }

  async function onSubmitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messageBody.trim();
    if (!selectedConversationId || !body) {
      return;
    }
    await sendMemberMessage({ conversationId: selectedConversationId, body });
    setMessageBody('');
  }

  async function onDeleteEndUser(options: { purgeConversations: boolean }) {
    if (!selectedConversation) {
      return;
    }

    const baseLabel = selectedConversation.endUserName ?? selectedConversation.endUserEmail;
    const keepHistoryCopy =
      `Delete ${baseLabel} from this workspace?\n\n` +
      'They will lose access, but existing chats stay for project history.';
    const purgeHistoryCopy =
      `Delete ${baseLabel} and purge all chat history?\n\n` +
      'This removes their existing conversations and messages. This cannot be undone.';

    const confirmed = window.confirm(options.purgeConversations ? purgeHistoryCopy : keepHistoryCopy);
    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setIsDeletingUser(true);
    try {
      await deleteEndUser({
        endUserId: selectedConversation.endUserId,
        purgeConversations: options.purgeConversations,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete user. Please try again.';
      setDeleteError(message);
    } finally {
      setIsDeletingUser(false);
    }
  }

  if (dashboard === undefined) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p className="text-slate-600">Loading dashboard...</p>
      </main>
    );
  }
  if (dashboard === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-8">
        <div className="rounded-2xl border border-sky-100 bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">No business profile yet</h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete onboarding to create your business account before using the dashboard.
          </p>
          <Link href="/start" className="mt-4 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white">
            Go to onboarding
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 bg-sky-50 p-6 md:grid-cols-[320px_1fr]">
      <section className="rounded-2xl border border-sky-100 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">{dashboard.business.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Business dashboard</p>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Intake links</h2>
            <button onClick={onCreateIntakeLink} className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm text-white">
              New link
            </button>
          </div>
          <div className="space-y-2">
            {dashboard.intakeLinks.map((link) => {
              const origin = typeof window === 'undefined' ? '' : window.location.origin;
              const url = `${origin}/i/${link.token}`;
              const fallbackUrl = `/i/${link.token}`;
              return (
                <div key={link._id} className="rounded-lg border border-sky-100 p-2">
                  <p className="truncate text-xs text-slate-600">{url || fallbackUrl}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => {
                        const origin = typeof window === 'undefined' ? '' : window.location.origin;
                        const fullUrl = `${origin}/i/${link.token}`;
                        void navigator.clipboard.writeText(fullUrl);
                      }}
                      className="rounded border border-sky-200 px-2 py-1 text-xs"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => onDisableIntakeLink(link._id)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-600"
                    >
                      Disable
                    </button>
                  </div>
                </div>
              );
            })}
            {dashboard.intakeLinks.length === 0 ? (
              <p className="text-sm text-slate-500">Create an intake link to start accepting end users.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-3 font-medium text-slate-900">Conversations</h2>
          <div className="space-y-2">
            {dashboard.conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => setSelectedConversationIdState(conversation._id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedConversationId === conversation._id
                    ? 'border-sky-400 bg-sky-50'
                    : 'border-sky-100 bg-white hover:bg-sky-50'
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{conversation.endUserName ?? conversation.endUserEmail}</p>
                <p className="truncate text-xs text-slate-500">{conversation.lastMessage ?? 'No messages yet'}</p>
              </button>
            ))}
            {dashboard.conversations.length === 0 ? (
              <p className="text-sm text-slate-500">No conversations yet.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-sky-100 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {selectedConversation ? selectedConversation.endUserName ?? selectedConversation.endUserEmail : 'Select a conversation'}
          </h2>
          {selectedConversation ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onDeleteEndUser({ purgeConversations: false })}
                disabled={isDeletingUser}
                className="rounded border border-red-200 px-2.5 py-1.5 text-xs text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete user (keep chats)'}
              </button>
              <button
                onClick={() => onDeleteEndUser({ purgeConversations: true })}
                disabled={isDeletingUser}
                className="rounded bg-red-600 px-2.5 py-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingUser ? 'Deleting...' : 'Delete user + purge chats'}
              </button>
            </div>
          ) : null}
        </div>
        {deleteError ? <p className="mt-2 text-sm text-red-600">{deleteError}</p> : null}
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-sky-100 bg-sky-50 p-3">
          {messages?.map((message) => (
            <div
              key={message._id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.senderType === 'member' ? 'ml-auto bg-sky-500 text-white' : 'bg-white text-slate-700'
              }`}
            >
              {message.body}
            </div>
          ))}
          {messages && messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
        </div>
        <form onSubmit={onSubmitMessage} className="mt-4 flex gap-2">
          <input
            value={messageBody}
            onChange={(event) => setMessageBody(event.target.value)}
            placeholder="Write a reply..."
            className="flex-1 rounded-lg border border-sky-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-sky-500 px-4 py-2 text-sm text-white">
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
