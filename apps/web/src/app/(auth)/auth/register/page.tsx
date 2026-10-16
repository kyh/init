import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { AuthFormSkeleton } from "@/app/(auth)/_components/auth-form-skeleton";
import { safeNextPath } from "@/app/(auth)/_components/next-path";

export const metadata: Metadata = {
  title: "Register",
};

interface PageProps {
  searchParams: Promise<{ nextPath?: string }>;
}

const RegisterForm = async ({ searchParams }: PageProps) => {
  const { nextPath } = await searchParams;
  return <AuthForm type="register" nextPath={safeNextPath(nextPath)} />;
};

const Page = ({ searchParams }: PageProps) => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div className="flex flex-col text-center">
      <h1 className="text-lg font-light">Create an account</h1>
      <p className="text-muted-foreground text-sm">
        New accounts are currently{" "}
        <Link className="underline" href="https://x.com/kaiyuhsu" target="_blank">
          invite only
        </Link>
        .
      </p>
    </div>
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterForm searchParams={searchParams} />
    </Suspense>
    <p className="text-muted-foreground px-8 text-center text-sm">
      Already have an account?{" "}
      <Link href="/auth/login" className="underline">
        Login
      </Link>
    </p>
  </div>
);

export default Page;
