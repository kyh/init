import { redirect } from "next/navigation";
import { getOrganization, getSession } from "@/lib/auth-server";
import { db } from "@repo/db/drizzle-client";
import { member, organization } from "@repo/db/drizzle-schema-auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return redirect("/auth/login");
  }

  if (session.session.activeOrganizationId) {
    const organization = await getOrganization({
      organizationId: session.session.activeOrganizationId,
    });
    if (organization) {
      return redirect(`/dashboard/${organization.slug}`);
    }
  }

  // No active organization — fall back to the first membership
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

  // Unreachable in practice — signup always creates an organization
  return redirect("/dashboard/account");
}
