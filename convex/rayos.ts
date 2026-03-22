import { v } from 'convex/values';
import { internalMutation, mutation, query, QueryCtx, MutationCtx } from './_generated/server';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';

type ConvexCtx = QueryCtx | MutationCtx;

/**
 * Canonicalizes emails so identity/linking comparisons are reliable.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Converts business names into URL-safe slugs.
 */
function createSlug(base: string): string {
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Generates a high-entropy token used for public intake links.
 */
function createIntakeToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Requires an authenticated WorkOS identity for protected operations.
 */
async function requireIdentity(ctx: ConvexCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Authentication required.');
  }
  return identity;
}

/**
 * Resolves the signed-in internal member profile for the current account.
 */
async function requireMember(ctx: ConvexCtx) {
  const identity = await requireIdentity(ctx);
  // Single-business assumption for now: one member record per auth identity.
  const member = await ctx.db
    .query('members')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!member) {
    throw new Error('No member profile found for this account.');
  }

  return { identity, member };
}

/**
 * Resolves the signed-in end-user identity mapping for customer-facing routes.
 */
async function requireEndUserIdentity(ctx: ConvexCtx) {
  const identity = await requireIdentity(ctx);
  const mapping = await ctx.db
    .query('endUserIdentities')
    .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!mapping) {
    throw new Error('No end-user profile is linked to this account.');
  }

  return { identity, mapping };
}

/**
 * Loads a conversation and fails fast with a consistent not-found error.
 */
async function loadConversationOrThrow(
  ctx: ConvexCtx,
  conversationId: Id<'conversations'>,
): Promise<Doc<'conversations'>> {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }
  return conversation;
}

/**
 * Loads a business and fails fast with a consistent not-found error.
 */
async function loadBusinessOrThrow(ctx: ConvexCtx, businessId: Id<'businesses'>): Promise<Doc<'businesses'>> {
  const business = await ctx.db.get(businessId);
  if (!business) {
    throw new Error('Business not found.');
  }
  return business;
}

/**
 * Ensures the signed-in member has a tenant context.
 * Creates an owner member + business on first login.
 */
export const ensureMemberProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
  },
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existingMember = await ctx.db
      .query('members')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (existingMember) {
      return { businessId: existingMember.businessId, memberId: existingMember._id };
    }

    throw new Error('No business profile found. Complete onboarding to create your business.');
  },
});

/**
 * Returns a member-scoped dashboard payload:
 * business metadata, active intake links, and recent conversations.
 */
export const getMemberDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const member = await ctx.db
      .query('members')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    if (!member) {
      return null;
    }
    const business = await loadBusinessOrThrow(ctx, member.businessId);

    const intakeLinks = await ctx.db
      .query('intakeLinks')
      .withIndex('by_businessId_and_status', (q) => q.eq('businessId', business._id).eq('status', 'active'))
      .order('desc')
      .take(20);

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_businessId_and_updatedAt', (q) => q.eq('businessId', business._id))
      .order('desc')
      .take(50);

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const endUser = await ctx.db.get(conversation.endUserId);
        const lastMessage = await ctx.db
          .query('messages')
          .withIndex('by_conversationId_and_createdAt', (q) => q.eq('conversationId', conversation._id))
          .order('desc')
          .take(1);

        return {
          ...conversation,
          endUserEmail: endUser?.email ?? 'unknown',
          endUserName: endUser?.name ?? null,
          lastMessage: lastMessage[0]?.body ?? null,
        };
      }),
    );

    return {
      business: {
        id: business._id,
        name: business.name,
        slug: business.slug,
      },
      member: {
        id: member._id,
        role: member.role,
        email: member.email,
      },
      intakeLinks,
      conversations: items,
    };
  },
});

/**
 * Resolves what role (if any) the signed-in account already has in Rayos.
 * Used to route people to dashboard, end-user inbox, or onboarding.
 */
export const getActorState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        email: null,
        name: null,
        hasMemberProfile: false,
        hasEndUserProfile: false,
      };
    }

    const member = await ctx.db
      .query('members')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    const endUserIdentity = await ctx.db
      .query('endUserIdentities')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    return {
      email: identity.email ?? null,
      name: identity.name ?? null,
      hasMemberProfile: !!member,
      hasEndUserProfile: !!endUserIdentity,
    };
  },
});

/**
 * Explicit onboarding step for business signups.
 * Creates a business and owner member profile for the current identity.
 */
export const createBusinessAccount = mutation({
  args: {
    fullName: v.string(),
    businessName: v.string(),
    pretendPaid: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existingMember = await ctx.db
      .query('members')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    if (existingMember) {
      return { businessId: existingMember.businessId, memberId: existingMember._id };
    }
    if (!args.pretendPaid) {
      throw new Error('Please acknowledge the pretend pricing checkbox to continue.');
    }

    const trimmedBusinessName = args.businessName.trim();
    const trimmedFullName = args.fullName.trim();
    if (!trimmedBusinessName) {
      throw new Error('Business name is required.');
    }
    if (!trimmedFullName) {
      throw new Error('Your name is required.');
    }

    const now = Date.now();
    const email = normalizeEmail(identity.email ?? `${identity.subject}@unknown.rayos`);
    const slugBase = createSlug(trimmedBusinessName) || 'rayos-business';
    const slug = `${slugBase}-${createIntakeToken().slice(0, 6)}`;

    const businessId = await ctx.db.insert('businesses', {
      name: trimmedBusinessName,
      slug,
      createdByTokenIdentifier: identity.tokenIdentifier,
      createdAt: now,
    });
    const memberId = await ctx.db.insert('members', {
      businessId,
      tokenIdentifier: identity.tokenIdentifier,
      email,
      name: trimmedFullName,
      role: 'owner',
      createdAt: now,
    });

    return { businessId, memberId };
  },
});

/**
 * Creates a new active intake link for the signed-in member's business.
 */
export const createIntakeLink = mutation({
  args: {},
  handler: async (ctx) => {
    const { member } = await requireMember(ctx);
    const token = createIntakeToken();
    const now = Date.now();

    const intakeLinkId = await ctx.db.insert('intakeLinks', {
      businessId: member.businessId,
      token,
      status: 'active',
      createdByMemberId: member._id,
      createdAt: now,
    });

    return { intakeLinkId, token };
  },
});

/**
 * Soft-disables an intake link so new joins are blocked.
 */
export const disableIntakeLink = mutation({
  args: {
    intakeLinkId: v.id('intakeLinks'),
  },
  handler: async (ctx, args) => {
    const { member } = await requireMember(ctx);
    const link = await ctx.db.get(args.intakeLinkId);
    if (!link || link.businessId !== member.businessId) {
      throw new Error('Intake link not found.');
    }

    await ctx.db.patch(link._id, { status: 'disabled' });
    return null;
  },
});

/**
 * Public helper for intake pages to show which business
 * the token belongs to before claim.
 */
export const getIntakeBusiness = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query('intakeLinks')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();

    if (!link || link.status !== 'active') {
      return null;
    }

    const business = await ctx.db.get(link.businessId);
    if (!business) {
      return null;
    }

    return {
      businessName: business.name,
      businessSlug: business.slug,
    };
  },
});

/**
 * Used for end users to claim an intake link and join a business.
 */
export const claimIntakeLink = mutation({
  args: {
    token: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const providedEmail = normalizeEmail(args.email);
    if (!providedEmail) {
      throw new Error('Email is required.');
    }

    const identityEmail = identity.email ? normalizeEmail(identity.email) : null;
    if (!identityEmail) {
      throw new Error('Your account needs an email address to join a business.');
    }
    if (identityEmail !== providedEmail) {
      throw new Error('For security, the intake email must match your signed-in account email.');
    }

    const link = await ctx.db
      .query('intakeLinks')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();

    if (!link || link.status !== 'active') {
      throw new Error('This intake link is invalid or disabled.');
    }

    const now = Date.now();
    const existingEndUser = await ctx.db
      .query('endUsers')
      .withIndex('by_businessId_and_email', (q) => q.eq('businessId', link.businessId).eq('email', providedEmail))
      .unique();

    let endUserId: Id<'endUsers'>;
    if (existingEndUser) {
      endUserId = existingEndUser._id;
      const incomingName = args.name?.trim();
      if (incomingName && !existingEndUser.name) {
        await ctx.db.patch(existingEndUser._id, { name: incomingName });
      }
    } else {
      endUserId = await ctx.db.insert('endUsers', {
        businessId: link.businessId,
        email: providedEmail,
        name: args.name?.trim() || identity.name || undefined,
        createdAt: now,
      });
    }

    const existingIdentity = await ctx.db
      .query('endUserIdentities')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (existingIdentity && existingIdentity.businessId !== link.businessId) {
      throw new Error('This account is already linked to another business.');
    }

    if (!existingIdentity) {
      await ctx.db.insert('endUserIdentities', {
        businessId: link.businessId,
        endUserId,
        tokenIdentifier: identity.tokenIdentifier,
        createdAt: now,
      });
    }

    const existingConversations = await ctx.db
      .query('conversations')
      .withIndex('by_businessId_and_endUserId', (q) => q.eq('businessId', link.businessId).eq('endUserId', endUserId))
      .order('desc')
      .take(1);

    const existingConversation = existingConversations[0];
    if (existingConversation) {
      return { conversationId: existingConversation._id };
    }

    const conversationId = await ctx.db.insert('conversations', {
      businessId: link.businessId,
      endUserId,
      status: 'open',
      subject: 'New project chat',
      createdAt: now,
      updatedAt: now,
    });

    return { conversationId };
  },
});

export const listEndUserDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const mapping = await ctx.db
      .query('endUserIdentities')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    if (!mapping) {
      return null;
    }
    const business = await loadBusinessOrThrow(ctx, mapping.businessId);
    const endUser = await ctx.db.get(mapping.endUserId);
    if (!endUser) {
      throw new Error('End-user profile not found.');
    }

    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_businessId_and_endUserId', (q) => q.eq('businessId', mapping.businessId).eq('endUserId', endUser._id))
      .order('desc')
      .take(50);

    return {
      business: {
        id: business._id,
        name: business.name,
      },
      endUser: {
        id: endUser._id,
        email: endUser.email,
        name: endUser.name ?? null,
      },
      conversations,
    };
  },
});

/**
 * Returns messages for a member-scoped conversation thread.
 */
export const getConversationMessagesForMember = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const { member } = await requireMember(ctx);
    const conversation = await loadConversationOrThrow(ctx, args.conversationId);
    if (conversation.businessId !== member.businessId) {
      throw new Error('Conversation not found in your business.');
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_conversationId_and_createdAt', (q) => q.eq('conversationId', conversation._id))
      .order('asc')
      .take(200);
  },
});

/**
 * Returns messages for an end-user conversation thread
 * after verifying end-user ownership.
 */
export const getConversationMessagesForEndUser = query({
  args: {
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const { mapping } = await requireEndUserIdentity(ctx);
    const conversation = await loadConversationOrThrow(ctx, args.conversationId);
    if (conversation.businessId !== mapping.businessId || conversation.endUserId !== mapping.endUserId) {
      throw new Error('Conversation not found for this account.');
    }

    return await ctx.db
      .query('messages')
      .withIndex('by_conversationId_and_createdAt', (q) => q.eq('conversationId', conversation._id))
      .order('asc')
      .take(200);
  },
});

/**
 * Sends a member-authored message into a tenant-scoped conversation.
 */
export const sendMemberMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { member } = await requireMember(ctx);
    const conversation = await loadConversationOrThrow(ctx, args.conversationId);
    if (conversation.businessId !== member.businessId) {
      throw new Error('Conversation not found in your business.');
    }

    const body = args.body.trim();
    if (!body) {
      throw new Error('Message body is required.');
    }

    const now = Date.now();
    await ctx.db.insert('messages', {
      businessId: member.businessId,
      conversationId: conversation._id,
      senderType: 'member',
      senderMemberId: member._id,
      body,
      createdAt: now,
    });
    await ctx.db.patch(conversation._id, { updatedAt: now });
    return null;
  },
});

/**
 * Sends an end-user-authored message into their own conversation.
 */
export const sendEndUserMessage = mutation({
  args: {
    conversationId: v.id('conversations'),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { mapping } = await requireEndUserIdentity(ctx);
    const conversation = await loadConversationOrThrow(ctx, args.conversationId);
    if (conversation.businessId !== mapping.businessId || conversation.endUserId !== mapping.endUserId) {
      throw new Error('Conversation not found for this account.');
    }

    const body = args.body.trim();
    if (!body) {
      throw new Error('Message body is required.');
    }

    const now = Date.now();
    await ctx.db.insert('messages', {
      businessId: mapping.businessId,
      conversationId: conversation._id,
      senderType: 'endUser',
      senderEndUserId: mapping.endUserId,
      body,
      createdAt: now,
    });
    await ctx.db.patch(conversation._id, { updatedAt: now });
    return null;
  },
});

/**
 * Internal batch worker for purging one end user's conversation history.
 * Deletes messages in chunks to stay within mutation transaction limits.
 */
export const purgeEndUserConversations = internalMutation({
  args: {
    businessId: v.id('businesses'),
    endUserId: v.id('endUsers'),
  },
  handler: async (ctx, args) => {
    const conversationBatch = await ctx.db
      .query('conversations')
      .withIndex('by_businessId_and_endUserId', (q) =>
        q.eq('businessId', args.businessId).eq('endUserId', args.endUserId),
      )
      .take(1);

    const conversation = conversationBatch[0];

    if (!conversation) {
      const endUser = await ctx.db.get(args.endUserId);
      if (endUser && endUser.businessId === args.businessId) {
        await ctx.db.delete(endUser._id);
      }
      return { done: true };
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_businessId_and_conversationId', (q) =>
        q.eq('businessId', args.businessId).eq('conversationId', conversation._id),
      )
      .take(200);

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    if (messages.length < 200) {
      await ctx.db.delete(conversation._id);
    }

    await ctx.scheduler.runAfter(0, internal.rayos.purgeEndUserConversations, {
      businessId: args.businessId,
      endUserId: args.endUserId,
    });

    return { done: false };
  },
});

/**
 * Deletes an end user from the current business.
 * By default this revokes access and anonymizes the profile while preserving chat history.
 * Set purgeConversations=true to asynchronously delete all existing chats/messages too.
 */
export const deleteEndUser = mutation({
  args: {
    endUserId: v.id('endUsers'),
    purgeConversations: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { member } = await requireMember(ctx);
    const endUser = await ctx.db.get(args.endUserId);

    if (!endUser || endUser.businessId !== member.businessId) {
      throw new Error('End user not found in your business.');
    }

    // Revoke all linked auth identities so the user can no longer access this workspace.
    while (true) {
      const identities = await ctx.db
        .query('endUserIdentities')
        .withIndex('by_endUserId', (q) => q.eq('endUserId', endUser._id))
        .take(50);
      if (identities.length === 0) {
        break;
      }
      for (const identity of identities) {
        await ctx.db.delete(identity._id);
      }
      if (identities.length < 50) {
        break;
      }
    }

    if (args.purgeConversations) {
      await ctx.scheduler.runAfter(0, internal.rayos.purgeEndUserConversations, {
        businessId: member.businessId,
        endUserId: endUser._id,
      });

      return {
        status: 'scheduled_purge',
      } as const;
    }

    await ctx.db.patch(endUser._id, {
      email: `deleted-${createIntakeToken().slice(0, 12)}@redacted.rayos`,
      name: 'Deleted user',
    });

    return {
      status: 'deleted_preserved_chats',
    } as const;
  },
});

/**
 * Deletes the signed-in account from Rayos app data.
 * For members, this revokes account access while preserving tenant history.
 * For end users, this revokes access and optionally purges their chat history.
 */
export const deleteMyAccount = mutation({
  args: {
    purgeConversations: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const member = await ctx.db
      .query('members')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();
    const mapping = await ctx.db
      .query('endUserIdentities')
      .withIndex('by_tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!member && !mapping) {
      throw new Error('No account profile found.');
    }

    if (member) {
      await ctx.db.patch(member._id, {
        tokenIdentifier: `deleted-member-${createIntakeToken()}`,
        email: `deleted-member-${createIntakeToken().slice(0, 12)}@redacted.rayos`,
        name: 'Deleted member',
      });
    }

    if (mapping) {
      const endUser = await ctx.db.get(mapping.endUserId);
      if (!endUser || endUser.businessId !== mapping.businessId) {
        throw new Error('End-user profile not found.');
      }

      // Revoke all linked auth identities so this end user can no longer sign in.
      while (true) {
        const identities = await ctx.db
          .query('endUserIdentities')
          .withIndex('by_endUserId', (q) => q.eq('endUserId', endUser._id))
          .take(50);
        if (identities.length === 0) {
          break;
        }
        for (const identityRow of identities) {
          await ctx.db.delete(identityRow._id);

        }
        if (identities.length < 50) {
          break;
        }
      }

      if (args.purgeConversations) {
        await ctx.scheduler.runAfter(0, internal.rayos.purgeEndUserConversations, {
          businessId: mapping.businessId,
          endUserId: endUser._id,
        });

        return {
          status: 'scheduled_purge',
        } as const;
      }

      await ctx.db.patch(endUser._id, {
        email: `deleted-${createIntakeToken().slice(0, 12)}@redacted.rayos`,
        name: 'Deleted user',
      });
    }

    return {
      status: 'deleted_preserved_history',
    } as const;
  },
});

