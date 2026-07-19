/**
 * Local dev seed. Idempotent: safe to run repeatedly (setup runs it, so does
 * `pnpm db:reset`). Gives an agent a known login and data to verify against
 * instead of an empty schema.
 *
 *   Login: dev@init.local / password
 *
 * The user is created through `auth.api.signUpEmail` rather than a raw insert so
 * the `databaseHooks.user.create.after` hook fires and provisions the personal
 * organization every todo hangs off of (see ./auth/auth.ts).
 */
import { db } from "@repo/db/drizzle-client";
import { todo } from "@repo/db/drizzle-schema";

import { auth } from "./auth/auth";

const DEV_EMAIL = "dev@init.local";
const DEV_PASSWORD = "password";
const DEV_NAME = "Dev User";

const seed = async () => {
  const existing = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.email, DEV_EMAIL),
  });

  let userId: string;
  if (existing) {
    userId = existing.id;
    console.log(`  ✓ user ${DEV_EMAIL} already exists`);
  } else {
    const { user } = await auth.api.signUpEmail({
      body: { email: DEV_EMAIL, password: DEV_PASSWORD, name: DEV_NAME },
    });
    userId = user.id;
    console.log(`  ✓ created ${DEV_EMAIL} (password: ${DEV_PASSWORD})`);
  }

  const membership = await db.query.member.findFirst({
    where: (member, { eq }) => eq(member.userId, userId),
  });
  if (!membership) {
    throw new Error("dev user has no organization — the signup hook did not run");
  }
  const { organizationId } = membership;

  const existingTodo = await db.query.todo.findFirst({
    where: (todo, { eq }) => eq(todo.organizationId, organizationId),
  });
  if (existingTodo) {
    console.log("  ✓ sample todos already present");
    return;
  }

  await db.insert(todo).values([
    {
      organizationId,
      title: "Read AGENTS.md",
      description: "The agent quickstart lives there.",
      completed: true,
    },
    {
      organizationId,
      title: "Run pnpm verify",
      description: "Typecheck, lint, format, and test in one gate.",
    },
    {
      organizationId,
      title: "Drive the app with agent-browser",
      description: "Open http://localhost:3000 and log in as dev@init.local.",
    },
  ]);
  console.log("  ✓ inserted sample todos");
};

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
