import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";

import { db } from "@repo/db/drizzle-client";
import { sql } from "drizzle-orm";

import { auth } from "./auth";

/**
 * The dashboard routes off `session.activeOrganizationId`, so a session without
 * one strands the user. better-auth runs `user.create.after` only once the
 * sign-up transaction commits — after the session row exists — so the personal
 * organization and the first session are created in an order no mock would
 * reproduce. This needs a real database: set TEST_POSTGRES_URL to a disposable
 * Postgres with the schema pushed.
 */
const skip = process.env.TEST_POSTGRES_URL ? false : "TEST_POSTGRES_URL is unset";

const newCredentials = () => ({
  email: `${randomUUID()}@example.com`,
  password: randomUUID(),
});

const organizationsOf = async (token: string | null) => {
  const session = await db.query.session.findFirst({ where: { token: token ?? "" } });
  assert.ok(session);
  const membership = await db.query.member.findFirst({ where: { userId: session.userId } });
  assert.ok(membership);
  return { active: session.activeOrganizationId, personal: membership.organizationId };
};

describe("active organization", { skip }, () => {
  after(async () => {
    await db.$client.end();
  });

  const credentials = newCredentials();

  test("is the personal organization on the sign-up session", async () => {
    const { token } = await auth.api.signUpEmail({ body: { ...credentials, name: "Ada" } });
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });

  test("is the personal organization on a sign-in session", async () => {
    const { token } = await auth.api.signInEmail({ body: credentials });
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });

  test("keeps the user when the sign-up session backfill fails", async () => {
    const blocked = newCredentials();
    await db.execute(sql`
      create function reject_session_update() returns trigger language plpgsql
      as $$ begin raise exception 'session updates rejected'; end $$
    `);
    await db.execute(sql`
      create trigger reject_session_update before update on session
      for each row execute function reject_session_update()
    `);
    try {
      await auth.api.signUpEmail({ body: { ...blocked, name: "Grace" } });
    } finally {
      await db.execute(sql`drop trigger reject_session_update on session`);
      await db.execute(sql`drop function reject_session_update()`);
    }

    const { token } = await auth.api.signInEmail({ body: blocked });
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });
});
