import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@repo/service/auth/auth";
import { Skeleton } from "@repo/ui/components/skeleton";
import { getSession } from "@/lib/auth-server";

import { InvitationActions } from "./_components/invitation-actions";

export const metadata: Metadata = {
  title: "Invitation",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

const Invitation = async ({ params }: PageProps) => {
  const [{ id }, session] = await Promise.all([params, getSession()]);
  if (!session) {
    redirect(`/auth/login?nextPath=/auth/invitation/${id}`);
  }

  // Throws when the invitation doesn't exist or the session user isn't
  // the invited email
  const invitation = await auth.api
    .getInvitation({ headers: await headers(), query: { id } })
    .catch(() => null);

  if (!invitation || invitation.status !== "pending") {
    return (
      <div className="mx-auto flex w-full flex-col justify-center space-y-4 text-center sm:w-[350px]">
        <h1 className="text-lg font-light">Invitation not found</h1>
        <p className="text-muted-foreground text-sm">
          This invitation is invalid, expired, or was sent to a different email address. You are
          signed in as {session.user.email}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
      <div className="flex flex-col text-center">
        <h1 className="text-lg font-light">Join {invitation.organizationName}</h1>
        <p className="text-muted-foreground text-sm">
          {invitation.inviterEmail} invited you to join as {invitation.role}.
        </p>
      </div>
      <InvitationActions
        invitationId={invitation.id}
        organizationSlug={invitation.organizationSlug}
      />
    </div>
  );
};

const InvitationSkeleton = () => (
  <div className="mx-auto flex w-full flex-col items-center justify-center space-y-6 sm:w-[350px]">
    <Skeleton className="h-6 w-48" />
    <Skeleton className="h-4 w-64" />
    <Skeleton className="h-9 w-full" />
  </div>
);

// The invitation depends on the URL and the session, so it streams in under Suspense.
const Page = ({ params }: PageProps) => (
  <Suspense fallback={<InvitationSkeleton />}>
    <Invitation params={params} />
  </Suspense>
);

export default Page;
