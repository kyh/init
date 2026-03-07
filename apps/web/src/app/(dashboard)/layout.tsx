import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { Sidebar } from "./_components/sidebar";

export const dynamic = "force-dynamic";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
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
