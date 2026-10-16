import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";

/**
 * Resolves an organization page's slug inside its Suspense boundary, sending a signed-out
 * visitor to login with the page as `nextPath`. `path` is the page's path below the slug.
 */
export const resolveOrganizationPage = async (params: Promise<{ slug: string }>, path = "") => {
  const { slug } = await params;
  const session = await getSession();
  if (!session) {
    return redirect(`/auth/login?nextPath=/dashboard/${slug}${path}`);
  }
  return { session, slug };
};
