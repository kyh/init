import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getSession } from "@/lib/auth-server";

import { Sidebar } from "./_components/sidebar";

export const metadata: Metadata = {
  robots: {
    index: false,
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_LINK_KEYS = ["todos", "members", "billing", "settings"];

const SidebarSkeleton = () => (
  <div className="sticky top-0 flex h-dvh w-[80px] flex-col items-center justify-between px-4 py-[26px]">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="size-10 rounded-lg" />
      {SIDEBAR_LINK_KEYS.map((key) => (
        <Skeleton key={key} className="size-9 rounded-lg" />
      ))}
    </div>
    <Skeleton className="size-9 rounded-full" />
  </div>
);

// The session is request data, so the sidebar streams in under Suspense and the page
// beside it renders in parallel. Each page checks the session itself before reading data.
const SessionSidebar = async () => {
  const session = await getSession();
  if (!session) {
    return redirect("/auth/login");
  }
  return <Sidebar user={session.user} />;
};

const Layout = (props: LayoutProps) => (
  <div className="flex min-h-dvh">
    <Suspense fallback={<SidebarSkeleton />}>
      <SessionSidebar />
    </Suspense>
    {props.children}
  </div>
);

export default Layout;
