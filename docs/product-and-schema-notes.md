# Rayos - Product and Schema Notes

## Shared language

- `Customer`: a business that pays for and uses Rayos.
- `Member`: a user who belongs to a customer/business account.
- `End user`: the customer of our customer (external person chatting about a
  project).

Use these terms everywhere in product, code, and docs.

## Goal for now (hackathon)

Build a calm, clean chat experience where:

1. A customer business can sign in and have multiple members.
2. End users can enter through a business-owned link.
3. End users are clearly linked to exactly one business.
4. Both sides can chat in a project conversation thread.

## My opinionated MVP cut (now)

- Do not build full role/permission complexity now; use a simple
  `owner/admin/member` field and enforce minimally.
- Do not support cross-business access at all.
- Require end user email on first entry (plus name optional).
- Intake through business share link (example: `/c/{slug}` or
  `/intake/{publicToken}`).
- After intake, create or find end user record for that business and open/create
  conversation.

This gives you a true multi-tenant foundation without getting stuck on
enterprise auth details.

## Suggested intake flow (now)

1. Business member creates a share link from Rayos.
2. End user opens link and enters email (and optional name).
3. System resolves business by link token/slug.
4. System creates or reuses end user under that business.
5. System creates or reuses conversation and drops end user into chat.

## Multi-tenant model (Convex-friendly)

Use `businessId` on every tenant-owned record. Treat it as mandatory.

### Tables

#### businesses

- `_id`
- `name`
- `slug` (unique)
- `createdByUserId`
- `createdAt`

#### members

- `_id`
- `businessId`
- `userId` (identity from auth provider)
- `role` (`owner` | `admin` | `member`)
- `createdAt`

#### intakeLinks

- `_id`
- `businessId`
- `token` (unique, random)
- `status` (`active` | `disabled`)
- `createdByMemberId`
- `createdAt`

#### endUsers

- `_id`
- `businessId`
- `email`
- `name` (optional)
- `createdAt`

Unique-ish behavior now: one end user per `(businessId, email)`.

#### conversations

- `_id`
- `businessId`
- `endUserId`
- `status` (`open` | `closed`)
- `subject` (optional)
- `createdAt`

#### messages

- `_id`
- `businessId`
- `conversationId`
- `senderType` (`member` | `endUser` | `system`)
- `senderMemberId` (optional)
- `senderEndUserId` (optional)
- `body`
- `createdAt`

## Security rules (non-negotiable now)

- Every query/mutation must determine actor identity first.
- Every read/write must check actor belongs to the same `businessId`.
- Never query data without a business constraint.
- Never trust client-provided `businessId` without membership or token
  verification.

If a function cannot prove tenant scope, it should fail.

## What can wait (future)

- Granular permissions matrix.
- Multiple inboxes/teams per business.
- End user verification beyond email.
- Assignments, SLAs, automations.
- Attachments, search, analytics.

## Immediate build checklist (tonight/tomorrow)

- [ ] Create core tables: `businesses`, `members`, `endUsers`, `conversations`,
      `messages`, `intakeLinks`.
- [ ] Implement business-member auth check helper.
- [ ] Implement intake-link resolution and end-user upsert by
      `(businessId, email)`.
- [ ] Implement `sendMessage` with strict tenant checks.
- [ ] Build two chat views: member inbox view and end-user chat view.
- [ ] Seed one demo business + demo member + demo intake link.

## Open decisions to finalize quickly

- [ ] URL format: slug-based (`/c/acme`) vs token-based (`/i/abc123`).
- [ ] Allow anonymous end-user return with same email only, or add magic-link
      verification now.
- [ ] Conversation creation: auto-create on first message vs explicit "new
      project chat" button.
