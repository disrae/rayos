'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function EndUserDashboardPage() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('conversationId');
  const sendEndUserMessage = useMutation(api.rayos.sendEndUserMessage);

  const dashboard = useQuery(api.rayos.listEndUserDashboard, {});
  const [selectedConversationIdState, setSelectedConversationIdState] = useState<Id<'conversations'> | null>(
    initialConversationId as Id<'conversations'> | null,
  );
  const [messageBody, setMessageBody] = useState('');
  const selectedConversationId = selectedConversationIdState ?? dashboard?.conversations[0]?._id ?? null;

  const messages = useQuery(
    api.rayos.getConversationMessagesForEndUser,
    selectedConversationId ? { conversationId: selectedConversationId } : 'skip',
  );

  const selectedConversation = useMemo(
    () => dashboard?.conversations.find((conversation) => conversation._id === selectedConversationId) ?? null,
    [dashboard?.conversations, selectedConversationId],
  );

  async function onSubmitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = messageBody.trim();
    if (!selectedConversationId || !body) {
      return;
    }
    await sendEndUserMessage({ conversationId: selectedConversationId, body });
    setMessageBody('');
  }

  if (dashboard === undefined) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <p className="text-slate-600">Loading your dashboard...</p>
      </main>
    );
  }
  if (dashboard === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-8">
        <div className="rounded-2xl border border-sky-100 bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">No end-user profile yet</h1>
          <p className="mt-2 text-sm text-slate-600">Join with an invite link from a business to access your chats.</p>
          <Link href="/start" className="mt-4 inline-block rounded-lg border border-sky-200 px-4 py-2 text-sm">
            Go to onboarding
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-6 bg-sky-50 p-6 md:grid-cols-[300px_1fr]">
      <section className="rounded-2xl border border-sky-100 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">{dashboard.business.name}</h1>
        <p className="mt-1 text-sm text-slate-500">End-user dashboard</p>
        <p className="mt-4 rounded-lg bg-sky-50 p-2 text-sm text-slate-600">{dashboard.endUser.email}</p>

        <div className="mt-6 space-y-2">
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
              <p className="text-sm font-medium text-slate-900">{conversation.subject ?? 'Project chat'}</p>
              <p className="text-xs text-slate-500">{conversation.status}</p>
            </button>
          ))}
          {dashboard.conversations.length === 0 ? (
            <p className="text-sm text-slate-500">No chats yet. Join a business intake link first.</p>
          ) : null}
        </div>
      </section>

      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-sky-100 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {selectedConversation ? selectedConversation.subject ?? 'Project chat' : 'Select a conversation'}
        </h2>
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-lg border border-sky-100 bg-sky-50 p-3">
          {messages?.map((message) => (
            <div
              key={message._id}
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.senderType === 'endUser' ? 'ml-auto bg-sky-500 text-white' : 'bg-white text-slate-700'
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
            placeholder="Write your message..."
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
