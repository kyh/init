import type { Metadata } from "next";
import { Suspense } from "react";

import { UpdatePasswordForm } from "@/app/(auth)/_components/auth-form";
import { AuthFormSkeleton } from "@/app/(auth)/_components/auth-form-skeleton";

export const metadata: Metadata = {
  title: "Update Password",
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

const TokenForm = async ({ searchParams }: PageProps) => {
  const { token } = await searchParams;
  return <UpdatePasswordForm token={token} />;
};

const Page = ({ searchParams }: PageProps) => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div className="flex flex-col gap-2 text-center">
      <h1 className="text-lg font-light">Update your Password</h1>
    </div>
    <Suspense fallback={<AuthFormSkeleton />}>
      <TokenForm searchParams={searchParams} />
    </Suspense>
  </div>
);

export default Page;
