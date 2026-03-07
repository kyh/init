import { redirect } from "next/navigation";
import { getOrganization, getSession } from "@repo/api/auth/auth";
import { eq } from "@repo/db";
import { db } from "@repo/db/drizzle-client";
import { member, organization } from "@repo/db/drizzle-schema-auth";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return redirect("/auth/login");
  }

  // If the user has an active organization, redirect to it
  if (session.session.activeOrganizationId) {
    const organization = await getOrganization({
      organizationId: session.session.activeOrganizationId,
    });
    if (organization) {
      return redirect(`/dashboard/${organization.slug}`);
    }
  }

  // If the user has no active organization, redirect to the first organization
  const firstMember = await db
    .select({
      organizationId: member.organizationId,
      organizationSlug: organization.slug,
    })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, session.user.id))
    .limit(1);
  if (firstMember[0]?.organizationSlug) {
    return redirect(`/dashboard/${firstMember[0].organizationSlug}`);
  }

  // Theoretically should never happen
  return redirect("/dashboard/account");
}
