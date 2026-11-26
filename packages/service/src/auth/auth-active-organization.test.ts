import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, test } from "node:test";

import { db } from "@repo/db/drizzle-client";
import { sql } from "drizzle-orm";

import { signInWithCode } from "./sign-in-code";

const testPostgresUrl = process.env.TEST_POSTGRES_URL;

const skip =
  testPostgresUrl === undefined || testPostgresUrl === "" ? "TEST_POSTGRES_URL is unset" : false;

const newEmail = () => `${randomUUID()}@example.com`;

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

  const email = newEmail();

  test("is the personal organization on the sign-up session", async () => {
    const { token } = await signInWithCode(email, "Ada");
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });

  test("is the personal organization on a sign-in session", async () => {
    const { token } = await signInWithCode(email, "Ada");
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });

  test("keeps the user when the sign-up session backfill fails", async () => {
    const blocked = newEmail();
    await db.execute(sql`
      create function reject_session_update() returns trigger language plpgsql
      as $$ begin raise exception 'session updates rejected'; end $$
    `);
    await db.execute(sql`
      create trigger reject_session_update before update on session
      for each row execute function reject_session_update()
    `);

    try {
      await signInWithCode(blocked, "Grace");
    } finally {
      await db.execute(sql`drop trigger reject_session_update on session`);
      await db.execute(sql`drop function reject_session_update()`);
    }

    const { token } = await signInWithCode(blocked, "Grace");
    const { active, personal } = await organizationsOf(token);
    assert.equal(active, personal);
  });
});
