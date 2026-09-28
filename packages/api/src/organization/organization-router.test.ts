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
    const user = { email: "test@example.com", id: "user-1", image: null, name: "Test User" };
    const [membership] = databaseRows(member, mockMembership);
    assert.ok(membership);
    context.responses.push(
      databaseRows(organization, org),
      databaseRows(member, mockMembership),
      // The relation rides a row_to_json lateral join, which the driver hands back parsed.
      [[...membership, user]],
      [],
    );
    const caller = createRouterClient(organizationRouter, { context });

    assert.deepEqual(await caller.get({ slug: "acme" }), {
      currentUserMember: mockMembership,
      invitations: [],
      members: [{ ...mockMembership, user }],
      organization: org,
      organizationMetadata: { personal: false },
    });

    const membersQuery = context.query.mock.calls.at(2);
    assert.ok(membersQuery);
    assert.match(
      membersQuery.arguments[0],
      /row_to_json\("t"\.\*\) "r" from \(select "d1"\."email" as "email", "d1"\."id" as "id", "d1"\."image" as "image", "d1"\."name" as "name" from "user" as "d1"/u,
    );
    assert.doesNotMatch(membersQuery.arguments[0], /ban_reason|stripe_customer_id|"d1"\."role"/u);
    assert.deepEqual(membersQuery.arguments[1], [1, "org-1"]);

    const invitationsQuery = context.query.mock.calls.at(3);
    assert.ok(invitationsQuery);
    assert.match(
      invitationsQuery.arguments[0],
      /from "invitation" as "d0" where \(\("d0"\."organization_id" = \$1\) and \("d0"\."status" <> \$2\)\)/u,
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
    const { organizationMetadata } = await caller.get({ slug: "acme" });
    assert.deepEqual(organizationMetadata, {});
  });
});
