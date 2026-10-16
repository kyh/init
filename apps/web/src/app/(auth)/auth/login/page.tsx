import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthFormSkeleton } from "@/app/(auth)/_components/auth-form-skeleton";
import { safeNextPath } from "@/app/(auth)/_components/next-path";

export const metadata: Metadata = {
  title: "Login",
};

interface PageProps {
  searchParams: Promise<{ nextPath?: string }>;
}

// URL data streams in under Suspense, so the rest of the page is the prefetched App Shell.
const LoginForm = async ({ searchParams }: PageProps) => {
  const { nextPath } = await searchParams;
  return <AuthForm type="login" nextPath={safeNextPath(nextPath)} />;
};

const Page = ({ searchParams }: PageProps) => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div className="flex flex-col text-center">
      <h1 className="text-lg font-light">Welcome back</h1>
    </div>
    <Suspense fallback={<AuthFormSkeleton />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
    <p className="text-muted-foreground px-8 text-center text-sm">
      Don&apos;t have an account?{" "}
      <Link href="/auth/register" className="underline">
        Register
      </Link>
    </p>
  </div>
);

export default Page;
