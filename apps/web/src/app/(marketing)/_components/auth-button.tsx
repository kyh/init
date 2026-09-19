"use client";

import Link from "next/link";
import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "cn";

import { authClient } from "@/lib/auth-client";

const buttonClassName = cn(
  buttonVariants({ size: "sm", variant: "secondary" }),
  "ml-4 w-24 rounded-full px-5",
);

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
