import { db } from "../client";
import { getSupabaseAdminClient } from "../supabase-admin-client";

async function main() {
  console.log("Seeding...");

  const adminClient = getSupabaseAdminClient();

  await adminClient.auth.admin.createUser({
    email: "im.kaiyu@gmail.com",
    password: "testing123",
    email_confirm: true,
  });

  const users = await db.query.authUsers.findMany({
    with: {
      teamMembers: true,
    },
  });

  for (const user of users) {
    const userTeam = user.teamMembers[0];
    if (!userTeam) continue;
  }
}

main()
  .then(() => {
    console.log("Seed complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed");
    console.error(err);
    process.exit(1);
  });
