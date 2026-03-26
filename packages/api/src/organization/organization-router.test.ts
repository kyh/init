import { describe, expect, it } from "vitest";

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

const MEMBER_OWNER = { id: "mem-1", organizationId: "org-1", userId: "user-1", role: "owner", createdAt: new Date("2024-01-01") };
const MEMBER_OTHER = { id: "mem-2", organizationId: "org-1", userId: "user-2", role: "member", createdAt: new Date("2024-01-01") };

const OTHER_USER = {
  ...mockUser,
  id: "user-2",
  name: "Other User",
  email: "other@example.com",
};

describe("organizationRouter.get", () => {
  it("returns org with members, invitations, and metadata", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findMany.mockResolvedValue([MEMBER_OWNER, MEMBER_OTHER]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);
    ctx.db.query.user.findMany.mockResolvedValue([mockUser, OTHER_USER]);

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
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue({ ...ORG, metadata: null });
    ctx.db.query.member.findMany.mockResolvedValue([MEMBER_OWNER]);
    ctx.db.query.invitation.findMany.mockResolvedValue([]);
    ctx.db.query.user.findMany.mockResolvedValue([mockUser]);

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    expect(result.organizationMetadata).toEqual({});
  });

  it("filters out canceled invitations", async () => {
    const ctx = createMockContext();
    ctx.db.query.organization.findFirst.mockResolvedValue(ORG);
    ctx.db.query.member.findMany.mockResolvedValue([MEMBER_OWNER]);
    ctx.db.query.invitation.findMany.mockResolvedValue([
      { id: "inv-1", email: "a@b.com", status: "pending", organizationId: "org-1" },
      { id: "inv-2", email: "c@d.com", status: "canceled", organizationId: "org-1" },
      { id: "inv-3", email: "e@f.com", status: "accepted", organizationId: "org-1" },
    ]);
    ctx.db.query.user.findMany.mockResolvedValue([mockUser]);

    const caller = createCaller(ctx);
    const result = await caller.get({ slug: "acme" });

    expect(result.invitations).toHaveLength(2);
    expect(result.invitations.map((i) => i.id)).toEqual(["inv-1", "inv-3"]);
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
    ctx.db.query.member.findMany.mockResolvedValue([MEMBER_OTHER]); // only other user

    const caller = createCaller(ctx);
    await expect(caller.get({ slug: "acme" })).rejects.toThrow(
      "You are not a member of this organization",
    );
  });

  it("throws UNAUTHORIZED when not logged in", async () => {
    const ctx = createMockContext({ session: null });
    const caller = createCaller(ctx);
    await expect(caller.get({ slug: "acme" })).rejects.toThrow("You must be logged in");
  });
});
