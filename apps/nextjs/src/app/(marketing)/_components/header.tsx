"use client";

import Link from "next/link";
import { buttonVariants } from "@repo/ui/button";
import { Logo } from "@repo/ui/logo";
import { cn } from "@repo/ui/utils";

import { authClient } from "@/auth/auth-client";

export const Header = () => {
  const { data, isPending } = authClient.useActiveOrganization();

  return (
    <div className="mx-auto w-full justify-center">
      <div className="border-t-none border-border mx-auto flex w-full max-w-7xl items-center justify-between border px-8 py-4 md:p-8">
        <div className="text-secondary-foreground flex items-center justify-between">
          <Link className="-ml-2" href="/">
            <Logo className="size-10" />
          </Link>
        </div>
        <nav className="ml-auto flex items-center text-sm">
          <Link
            className="text-muted-foreground hover:text-secondary-foreground px-4 py-2 transition"
            href="/docs"
          >
            Documentation
          </Link>
          <Link
            className="text-muted-foreground hover:text-secondary-foreground px-4 py-2 transition"
            href="https://github.com/kyh/init"
            target="_blank"
          >
            Github
          </Link>
          {isPending ? (
            <span
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "pointer-events-none ml-4 w-24 animate-pulse rounded-full px-5",
              )}
            />
          ) : data ? (
            <Link
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "ml-4 w-24 rounded-full px-5",
              )}
              href={`/dashboard/${data.slug}`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "ml-4 w-24 rounded-full px-5",
              )}
              href="/auth/login"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
};
