import { redirect } from "next/navigation";
import { getOrganization, getSession } from "@repo/api/auth/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return redirect("/auth/login");
  }

  if (!session.session.activeOrganizationId) {
    return redirect("/dashboard/account");
  }

  const organization = await getOrganization({
    organizationId: session.session.activeOrganizationId,
  });
  if (!organization) {
    return redirect("/dashboard/account");
  }

  return redirect(`/dashboard/${organization.slug}`);
}
