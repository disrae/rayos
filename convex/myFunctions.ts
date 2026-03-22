import { query } from './_generated/server';

// Placeholder module kept for compatibility with the template.
// Rayos app logic lives in convex/rayos.ts.
export const templateStatus = query({
  args: {},
  handler: async () => {
    return { ok: true };
  },
});
