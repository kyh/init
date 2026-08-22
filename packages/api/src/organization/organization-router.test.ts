import assert from "node:assert/strict";
import { describe, test } from "node:test";
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
  ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
  ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(MEMBER_OWNER));
  return ctx;
};

describe("organizationRouter.get", () => {
  test("returns org with members, invitations, and metadata", async () => {
    const ctx = authedContext();
    // drizzle embeds the related user via `with`, so rows arrive pre-joined
    ctx.db.query.member.findMany.mock.mockImplementation(() =>
      Promise.resolve([
        { ...MEMBER_OWNER, user: mockUser },
        { ...MEMBER_OTHER, user: OTHER_USER },
      ]),
    );
    ctx.db.query.invitation.findMany.mock.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    assert.deepEqual(result.organization, ORG);
    assert.deepEqual(result.organizationMetadata, { personal: false });
    assert.deepEqual(result.currentUserMember, MEMBER_OWNER);
    assert.strictEqual(result.members.length, 2);
    assert.deepEqual(result.members[0]?.user, mockUser);
    assert.deepEqual(result.members[1]?.user, OTHER_USER);
  });

  test("parses metadata defaulting to empty object when null", async () => {
    const ctx = authedContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() =>
      Promise.resolve({ ...ORG, metadata: null }),
    );
    ctx.db.query.member.findMany.mock.mockImplementation(() =>
      Promise.resolve([{ ...MEMBER_OWNER, user: mockUser }]),
    );
    ctx.db.query.invitation.findMany.mock.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    assert.deepEqual(result.organizationMetadata, {});
  });

  test("excludes canceled invitations in SQL rather than in JS", async () => {
    const ctx = authedContext();
    ctx.db.query.member.findMany.mock.mockImplementation(() => Promise.resolve([]));
    ctx.db.query.invitation.findMany.mock.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(ctx);
    await caller.get({ slug: "acme" });

    // Compile the where-callback the router handed drizzle: the filter has to
    // reach Postgres, or a canceled invitation is fetched and then dropped.
    const config = ctx.db.query.invitation.findMany.mock.calls[0]?.arguments[0];
    const condition = config?.where?.(invitation, { and, eq, ne });
    assert.ok(condition);
    const { sql, params } = new PgDialect().sqlToQuery(condition);

    assert.strictEqual(
      sql,
      '("invitation"."organization_id" = $1 and "invitation"."status" <> $2)',
    );
    assert.deepEqual(params, ["org-1", "canceled"]);
  });

  test("requests only non-admin user columns for members", async () => {
    const ctx = authedContext();
    ctx.db.query.member.findMany.mock.mockImplementation(() => Promise.resolve([]));
    ctx.db.query.invitation.findMany.mock.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(ctx);
    await caller.get({ slug: "acme" });

    // role/banned/banReason must never reach the client via the member join
    const config = ctx.db.query.member.findMany.mock.calls[0]?.arguments[0];
    assert.deepEqual(config?.with?.user?.columns, {
      id: true,
      name: true,
      email: true,
      image: true,
    });
  });

  test("throws NOT_FOUND when organization does not exist", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(caller.get({ slug: "nope" }), /Organization not found/);
  });

  test("throws UNAUTHORIZED when user is not a member", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mock.mockImplementation(() => Promise.resolve(ORG));
    // caller has no membership
    ctx.db.query.member.findFirst.mock.mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(ctx);
    await assert.rejects(
      caller.get({ slug: "acme" }),
      /You do not have access to this organization/,
    );
  });

  test("throws UNAUTHORIZED when not logged in", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await assert.rejects(caller.get({ slug: "acme" }), /You must be logged in/);
  });
});
