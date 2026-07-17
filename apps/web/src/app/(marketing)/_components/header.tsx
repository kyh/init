import Link from "next/link";
import { Logo } from "@repo/ui/components/logo";

import { AuthButton } from "./auth-button";

export const Header = () => {
  return (
    <div className="mx-auto w-full justify-center">
      <div className="border-t-0 border-border mx-auto flex w-full max-w-7xl items-center justify-between border px-8 py-4 md:p-8">
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
          <AuthButton />
        </nav>
      </div>
    </div>
  );
};
