<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

# Rayos Project Brief

Rayos is a B2B chat platform for project-based businesses to communicate clearly with their customers while planning and delivering projects.

## Product priorities

- Build trust through clarity, responsiveness, and predictable behavior.
- Keep collaboration simple for both internal teams and customer stakeholders.
- Preserve a clear history of decisions, changes, and commitments.

## Technical stack

- Frontend: Next.js
- Backend/database/realtime: Convex
- Development experience: Cursor + TypeScript strict mode

## UX and brand direction

- Brand tone: light, peaceful, clean, and professional.
- Interface should feel calm and focused, never noisy or cluttered.
- Favor clear hierarchy, generous spacing, and simple language.

## Core engineering expectations

- Default to secure multi-tenant patterns for all customer and project data.
- Keep wrappers thin and place business logic in typed helper functions.
- Validate public inputs and enforce authentication/authorization at boundaries.
