import { redirect } from "next/navigation";
import { getOrganizationById, getSession, listOrganizations } from "@/lib/auth-server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return redirect("/auth/login");
  }

  if (session.session.activeOrganizationId) {
    const organization = await getOrganizationById(session.session.activeOrganizationId);
    if (organization) {
      return redirect(`/dashboard/${organization.slug}`);
    }
  }

  // No active organization — fall back to the first membership. The db query
  // this replaced had limit(1) with no orderBy, so first-of-list matches.
  const organizations = await listOrganizations();
  const firstSlug = organizations[0]?.slug;
  if (firstSlug) {
    return redirect(`/dashboard/${firstSlug}`);
  }

  // Unreachable in practice — signup always creates an organization
  return redirect("/dashboard/account");
}
