import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { Sidebar } from "./_components/sidebar";

export const dynamic = "force-dynamic";

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
