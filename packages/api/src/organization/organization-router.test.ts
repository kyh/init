import { describe, expect, it } from "vitest";
import { invitation } from "@repo/db/drizzle-schema-auth";
import { and, eq, ne } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

import { createMockContext, mockUser } from "../test-utils";
import { createCallerFactory } from "../trpc";
import { organizationRouter } from "./organization-router";

const createCaller = createCallerFactory(organizationRouter);

const ORG = {
  id: "org-1",
  name: "Acme",
  slug: "acme",
  logo: null,
  metadata: '{"personal": false}',
  createdAt: new Date("2024-01-01"),
};

const MEMBER_OWNER = {
  id: "mem-1",
  organizationId: "org-1",
  userId: "user-1",
  role: "owner",
  createdAt: new Date("2024-01-01"),
};
const MEMBER_OTHER = {
  id: "mem-2",
  organizationId: "org-1",
  userId: "user-2",
  role: "member",
  createdAt: new Date("2024-01-01"),
};

const OTHER_USER = {
  ...mockUser,
  id: "user-2",
  name: "Other User",
  email: "other@example.com",
};

/** organizationProcedure resolves the org, then the caller's membership. */
const authedContext = () => {
  const ctx = createMockContext();
  ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
  ctx.db.query.member.findFirst.mockResolvedValue(MEMBER_OWNER);
  return ctx;
};

describe("organizationRouter.get", () => {
  it("returns org with members, invitations, and metadata", async () => {
    const ctx = authedContext();
    // drizzle embeds the related user via `with`, so rows arrive pre-joined
    ctx.db.query.member.findMany.mockResolvedValue([
      { ...MEMBER_OWNER, user: mockUser },
      { ...MEMBER_OTHER, user: OTHER_USER },
    ]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    expect(result.organization).toEqual(ORG);
    expect(result.organizationMetadata).toEqual({ personal: false });
    expect(result.currentUserMember).toEqual(MEMBER_OWNER);
    expect(result.members).toHaveLength(2);
    expect(result.members[0]?.user).toEqual(mockUser);
    expect(result.members[1]?.user).toEqual(OTHER_USER);
  });

  it("parses metadata defaulting to empty object when null", async () => {
    const ctx = authedContext();
    ctx.db.query.organization.findFirst.mockResolvedValue({ ...ORG, metadata: null });
    ctx.db.query.member.findMany.mockResolvedValue([{ ...MEMBER_OWNER, user: mockUser }]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    expect(result.organizationMetadata).toEqual({});
  });

  it("excludes canceled invitations in SQL rather than in JS", async () => {
    const ctx = authedContext();
    ctx.db.query.member.findMany.mockResolvedValue([]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);

    const caller = createCaller(ctx);
    await caller.get({ slug: "acme" });

    // Compile the where-callback the router handed drizzle: the filter has to
    // reach Postgres, or a canceled invitation is fetched and then dropped.
    const [args] = ctx.db.query.invitation.findMany.mock.calls[0] ?? [];
    const { sql, params } = new PgDialect().sqlToQuery(args.where(invitation, { and, eq, ne }));

    expect(sql).toBe('("invitation"."organization_id" = $1 and "invitation"."status" <> $2)');
    expect(params).toEqual(["org-1", "canceled"]);
  });

  it("requests only non-admin user columns for members", async () => {
    const ctx = authedContext();
    ctx.db.query.member.findMany.mockResolvedValue([]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);

    const caller = createCaller(ctx);
    await caller.get({ slug: "acme" });

    // role/banned/banReason must never reach the client via the member join
    const [args] = ctx.db.query.member.findMany.mock.calls[0] ?? [];
    expect(args.with.user.columns).toEqual({ id: true, name: true, email: true, image: true });
  });

  it("throws NOT_FOUND when organization does not exist", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(undefined);

    const caller = createCaller(ctx);
    await expect(caller.get({ slug: "nope" })).rejects.toThrow("Organization not found");
  });

  it("throws UNAUTHORIZED when user is not a member", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findFirst.mockResolvedValue(undefined); // caller has no membership

    const caller = createCaller(ctx);
    await expect(caller.get({ slug: "acme" })).rejects.toThrow(
      "You do not have access to this organization",
    );
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await expect(caller.get({ slug: "acme" })).rejects.toThrow("You must be logged in");
  });
});
