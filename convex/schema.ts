import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  businesses: defineTable({
    name: v.string(),
    slug: v.string(),
    createdByTokenIdentifier: v.string(),
    createdAt: v.number(),
  }).index('by_slug', ['slug']),

  members: defineTable({
    businessId: v.id('businesses'),
    tokenIdentifier: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('member')),
    createdAt: v.number(),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_businessId', ['businessId']),

  intakeLinks: defineTable({
    businessId: v.id('businesses'),
    token: v.string(),
    status: v.union(v.literal('active'), v.literal('disabled')),
    createdByMemberId: v.id('members'),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_businessId_and_status', ['businessId', 'status']),

  endUsers: defineTable({
    businessId: v.id('businesses'),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_businessId_and_email', ['businessId', 'email']),

  endUserIdentities: defineTable({
    businessId: v.id('businesses'),
    endUserId: v.id('endUsers'),
    tokenIdentifier: v.string(),
    createdAt: v.number(),
  })
    .index('by_tokenIdentifier', ['tokenIdentifier'])
    .index('by_endUserId', ['endUserId']),

  conversations: defineTable({
    businessId: v.id('businesses'),
    endUserId: v.id('endUsers'),
    status: v.union(v.literal('open'), v.literal('closed')),
    subject: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_businessId_and_updatedAt', ['businessId', 'updatedAt'])
    .index('by_businessId_and_endUserId', ['businessId', 'endUserId']),

  messages: defineTable({
    businessId: v.id('businesses'),
    conversationId: v.id('conversations'),
    senderType: v.union(v.literal('member'), v.literal('endUser'), v.literal('system')),
    senderMemberId: v.optional(v.id('members')),
    senderEndUserId: v.optional(v.id('endUsers')),
    body: v.string(),
    createdAt: v.number(),
  })
    .index('by_conversationId_and_createdAt', ['conversationId', 'createdAt'])
    .index('by_businessId_and_conversationId', ['businessId', 'conversationId']),
});
