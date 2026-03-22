# Rayos

Rayos is a calm, clean B2B chat product for project-based businesses and their end users.

## Stack

- Next.js (App Router)
- Convex (database + backend functions)
- WorkOS AuthKit (authentication)
- Tailwind CSS

## Terminology

- `Customer`: a business account using Rayos.
- `Member`: an internal user of a customer business.
- `End user`: the customer of that business.

## MVP routes

- `/` landing page
- `/start` role guard + onboarding (business signup or invite-link entry)
- `/dashboard` member dashboard (intake links + conversation inbox)
- `/i/[token]` public intake route for end users
- `/end-user` end-user dashboard (their own chats)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure WorkOS env vars in `.env.local`:
   - `WORKOS_CLIENT_ID`
   - `WORKOS_API_KEY`
   - `WORKOS_COOKIE_PASSWORD`

3. Start Convex + Next:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Demo bootstrap and walkthrough

Use this flow to demo end-to-end in minutes:

1. Sign in as a member and open `/start`.
2. Complete onboarding: name, business name, and the pretend-pricing checkbox.
3. You land in `/dashboard`; click `New link` and copy the intake URL.
4. Open the link in another browser/profile and sign in as a different account.
5. On `/i/[token]`, confirm email and join chat.
6. You are redirected to `/end-user` and can message the business.
7. Return to `/dashboard` and reply from the member side.

## Multi-tenant guarantees in MVP

- Every business-owned record includes `businessId`.
- Member operations are scoped by member `businessId`.
- End-user operations are scoped by `endUserIdentities` mapping.
- No cross-business reads/writes are permitted by backend functions.
