"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { toast } from "@repo/ui/components/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/lib/form";
import { ROLES, roleSchema } from "@repo/api/auth/permissions";
import {
  invalidateOrganization,
  useOrganization,
} from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

const MAX_INVITES = 5;

const inviteMembersSchema = z.object({
  organizationInvitations: z.array(
    z.object({
      email: z.email("Invalid email address"),
      key: z.string(),
      role: roleSchema,
    }),
  ),
});

// `key` is client-only (React list identity); the mutation maps email/role explicitly
type InviteModel = z.infer<typeof inviteMembersSchema>["organizationInvitations"][number];

const createEmptyInviteModel = (): InviteModel => ({
  email: "",
  key: crypto.randomUUID(),
  role: "member",
});

const useInviteMembers = (slug: string, organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof inviteMembersSchema>) => {
      const results = await Promise.allSettled(
        data.organizationInvitations.map((invite) =>
          authClient.organization.inviteMember({
            email: invite.email,
            fetchOptions: { throw: true },
            organizationId,
            role: invite.role,
          }),
        ),
      );
      const failed = results.find((result) => result.status === "rejected");
      if (failed) {
        throw failed.reason;
      }
    },
    onError: (error) => toast.error(error.message),
    // Some invitations may succeed even when another fails.
    onSettled: () => invalidateOrganization(queryClient, slug),
    onSuccess: () => {
      toast.success("Invitations sent successfully");
    },
  });
};

interface InviteMembersFormProps {
  slug: string;
  onInviteSuccess?: () => void;
}

const InviteMembersForm = ({ slug, onInviteSuccess }: InviteMembersFormProps) => {
  const { data: organizationData } = useOrganization(slug);
  const { mutate: inviteMembers, isPending: isInvitingMembers } = useInviteMembers(
    slug,
    organizationData.organization.id,
  );

  const form = useAppForm({
    defaultValues: {
      organizationInvitations: [createEmptyInviteModel()],
    },
    onSubmit: ({ value, formApi }) => {
      inviteMembers(value, {
        onSuccess: () => {
          formApi.reset({ organizationInvitations: [createEmptyInviteModel()] });
          onInviteSuccess?.();
        },
      });
    },
    validators: {
      onSubmit: inviteMembersSchema,
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-2">
        <form.Field name="organizationInvitations" mode="array">
          {(arrayField) => (
            <>
              {arrayField.state.value?.map((invite, index) => (
                <div key={invite.key} className="flex items-end gap-2">
                  <form.AppField
                    name={`organizationInvitations[${index}].email`}
                    validators={{
                      onBlur: z.email("Invalid email address"),
                    }}
                  >
                    {(field) => (
                      <field.TextField
                        label="Email"
                        labelClassName={index === 0 ? undefined : "sr-only"}
                        className="w-7/12"
                        type="email"
                        required
                        placeholder="member@email.com"
                      />
                    )}
                  </form.AppField>
                  <form.AppField
                    name={`organizationInvitations[${index}].role`}
                    validators={{ onBlur: roleSchema }}
                  >
                    {(field) => (
                      <field.SelectField
                        label="Role"
                        labelClassName={index === 0 ? undefined : "sr-only"}
                        className="w-4/12"
                        options={ROLES.map((role) => ({ label: role, value: role }))}
                        itemClassName="text-sm capitalize"
                      />
                    )}
                  </form.AppField>
                  <div className="flex w-[40px] justify-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={(arrayField.state.value?.length ?? 0) <= 1}
                            aria-label="Remove invite"
                            onClick={() => {
                              arrayField.removeValue(index);
                            }}
                          />
                        }
                      >
                        <XIcon className="h-4 lg:h-5" />
                      </TooltipTrigger>
                      <TooltipContent>Remove invite</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
              {(arrayField.state.value?.length ?? 0) < MAX_INVITES && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => arrayField.pushValue(createEmptyInviteModel())}
                >
                  <PlusIcon className="mr-1 h-3" />
                  <span>Add another one</span>
                </Button>
              )}
            </>
          )}
        </form.Field>
        <Button className="mt-5 w-full" type="submit" loading={isInvitingMembers}>
          Send Invites
        </Button>
      </div>
    </form>
  );
};

interface InviteMembersDialogProps {
  slug: string;
}

export const InviteMembersDialog = ({ slug }: InviteMembersDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon className="mr-1 size-4" />
        <span>Invite Members</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members to your Organization</DialogTitle>
          <DialogDescription>
            Invite members to your organization by entering their email and role.
          </DialogDescription>
        </DialogHeader>
        <InviteMembersForm
          slug={slug}
          onInviteSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
