import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, getSession } from "@repo/api/auth/auth";

import { InvitationActions } from "./_components/invitation-actions";

export const metadata: Metadata = {
  title: "Invitation",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const [{ id }, session] = await Promise.all([params, getSession()]);
  if (!session) {
    redirect(`/auth/login?nextPath=/auth/invitation/${id}`);
  }

  // Throws when the invitation doesn't exist or the session user isn't
  // the invited email
  const invitation = await auth.api
    .getInvitation({ query: { id }, headers: await headers() })
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

export default Page;
