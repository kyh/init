import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// WARNING: hand-maintained; a better-auth CLI regen drops withRLS, these indexes and rate_limit, so restore them.
export const user = pgTable.withRLS(
  "user",
  {
    banExpires: timestamp("ban_expires"),
    banReason: text("ban_reason"),
    banned: boolean("banned").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    id: text("id").primaryKey(),
    image: text("image"),
    name: text("name").notNull(),
    role: text("role"),
    stripeCustomerId: text("stripe_customer_id"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_stripeCustomerId_idx").on(table.stripeCustomerId)],
);

export const session = pgTable.withRLS(
  "session",
  {
    activeOrganizationId: text("active_organization_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    impersonatedBy: text("impersonated_by"),
    ipAddress: text("ip_address"),
    token: text("token").notNull().unique(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable.withRLS(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable.withRLS(
  "verification",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable.withRLS(
  "organization",
  {
    createdAt: timestamp("created_at").notNull(),
    id: text("id").primaryKey(),
    logo: text("logo"),
    metadata: text("metadata"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable.withRLS(
  "member",
  {
    createdAt: timestamp("created_at").notNull(),
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable.withRLS(
  "invitation",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: text("email").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: text("id").primaryKey(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    role: text("role"),
    status: text("status").default("pending").notNull(),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const subscription = pgTable.withRLS(
  "subscription",
  {
    billingInterval: text("billing_interval"),
    cancelAt: timestamp("cancel_at"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),
    id: text("id").primaryKey(),
    periodEnd: timestamp("period_end"),
    periodStart: timestamp("period_start"),
    plan: text("plan").notNull(),
    referenceId: text("reference_id").notNull(),
    seats: integer("seats"),
    status: text("status").default("incomplete"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeScheduleId: text("stripe_schedule_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    trialEnd: timestamp("trial_end"),
    trialStart: timestamp("trial_start"),
  },
  (table) => [
    index("subscription_referenceId_idx").on(table.referenceId),
    index("subscription_stripeSubscriptionId_idx").on(table.stripeSubscriptionId),
    index("subscription_stripeCustomerId_idx").on(table.stripeCustomerId),
  ],
);

export const rateLimit = pgTable.withRLS("rate_limit", {
  count: integer("count").notNull(),
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
