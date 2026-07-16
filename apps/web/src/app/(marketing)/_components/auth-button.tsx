"use client";

import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

import { authClient } from "@/lib/auth-client";

const buttonClassName = cn(
  buttonVariants({ variant: "secondary", size: "sm" }),
  "ml-4 w-24 rounded-full px-5",
);

/**
 * Client leaf of the marketing header — the only part that needs the session.
 * Keeping it a leaf lets the rest of the header render as a server component.
 */
export const AuthButton = () => {
  const { data, isPending } = authClient.useActiveOrganization();

  if (isPending) {
    return <span className={cn(buttonClassName, "pointer-events-none animate-pulse")} />;
  }

  return data ? (
    <Link className={buttonClassName} href={`/dashboard/${data.slug}`}>
      Dashboard
    </Link>
  ) : (
    <Link className={buttonClassName} href="/auth/login">
      Login
    </Link>
  );
};
