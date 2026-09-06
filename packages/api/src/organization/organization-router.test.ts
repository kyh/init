import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createRouterClient } from "@orpc/server";
import { member, organization } from "@repo/db/drizzle-schema-auth";

import { createMockContext, databaseRows, mockMembership, mockOrganization } from "../test-utils";
import { organizationRouter } from "./organization-router";

describe("organizationRouter.get", () => {
  test("returns organization metadata, members and invitations without exposing admin fields", async () => {
    const context = createMockContext();
    const org = { ...mockOrganization, metadata: '{"personal": false}' };
    const user = { id: "user-1", name: "Test User", email: "test@example.com", image: null };
    const [membership] = databaseRows(member, mockMembership);
    assert.ok(membership);
    context.responses.push(
      databaseRows(organization, org),
      databaseRows(member, mockMembership),
      [[...membership, JSON.stringify(Object.values(user))]],
      [],
    );
    const caller = createRouterClient(organizationRouter, { context });

    assert.deepEqual(await caller.get({ slug: "acme" }), {
      organization: org,
      organizationMetadata: { personal: false },
      currentUserMember: mockMembership,
      members: [{ ...mockMembership, user }],
      invitations: [],
    });

    const membersQuery = context.query.mock.calls[2];
    assert.ok(membersQuery);
    assert.match(
      membersQuery.arguments[0],
      /json_build_array\("member_user"\."id", "member_user"\."name", "member_user"\."email", "member_user"\."image"\)/,
    );
    assert.doesNotMatch(
      membersQuery.arguments[0],
      /ban_reason|stripe_customer_id|"member_user"\."role"/,
    );
    assert.deepEqual(membersQuery.arguments[1], [1, "org-1"]);

    const invitationsQuery = context.query.mock.calls[3];
    assert.ok(invitationsQuery);
    assert.match(
      invitationsQuery.arguments[0],
      /where \("invitation"\."organization_id" = \$1 and "invitation"\."status" <> \$2\)/,
    );
    assert.deepEqual(invitationsQuery.arguments[1], ["org-1", "canceled"]);
  });

  test("defaults absent metadata to an empty object", async () => {
    const context = createMockContext();
    context.responses.push(
      databaseRows(organization, mockOrganization),
      databaseRows(member, mockMembership),
      [],
      [],
    );
    const caller = createRouterClient(organizationRouter, { context });
    assert.deepEqual((await caller.get({ slug: "acme" })).organizationMetadata, {});
  });
});
