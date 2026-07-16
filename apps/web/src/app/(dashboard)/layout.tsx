import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";

import { Sidebar } from "./_components/sidebar";

// The layout awaits getSession() → headers() unconditionally, which already
// makes every dashboard route request-dynamic, so no explicit dynamic export is
// needed — and it would block the Next 16 cacheComponents migration.

// Auth-gated; crawlers only ever see the login redirect.
export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = async (props: LayoutProps) => {
  const session = await getSession();
  if (!session) {
    return redirect("/auth/login");
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar user={session.user} />
      {props.children}
    </div>
  );
};

export default Layout;
