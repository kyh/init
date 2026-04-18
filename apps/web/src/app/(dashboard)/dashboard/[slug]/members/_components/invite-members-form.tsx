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
import { Field, FieldContent, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/react";

/**
 * The maximum number of invites that can be sent at once.
 * Useful to avoid spamming the server with too large payloads
 */
const MAX_INVITES = 5;

type InviteMembersDialogProps = {
  slug: string;
};

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

const roleSchema = z.enum(["owner", "admin", "member"], {
  error: "Select a role",
});
type Role = z.infer<typeof roleSchema>;
const ROLES: readonly Role[] = ["owner", "admin", "member"];

const inviteMembersSchema = z.object({
  organizationInvitations: z.array(
    z.object({
      email: z.email("Invalid email address"),
      role: roleSchema,
    }),
  ),
});

type InviteMembersFormProps = {
  slug: string;
  onInviteSuccess?: () => void;
};

export const InviteMembersForm = ({ slug, onInviteSuccess }: InviteMembersFormProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
  const { mutateAsync: inviteMembers, isPending: isInvitingMembers } = useInviteMembers(
    organizationData.organization.id,
  );

  const form = useForm({
    defaultValues: {
      organizationInvitations: [createEmptyInviteModel()],
    },
    validators: {
      onSubmit: inviteMembersSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      await inviteMembers(value);
      formApi.reset({
        organizationInvitations: [createEmptyInviteModel()],
      });
      onInviteSuccess?.();
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
              {arrayField.state.value?.map((_, index) => (
                <div key={index} className="flex items-end gap-2">
                  <form.Field
                    name={`organizationInvitations[${index}].email`}
                    validators={{
                      onBlur: z.email("Invalid email address"),
                    }}
                  >
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid} className="w-7/12 gap-1">
                          {index === 0 && (
                            <FieldLabel htmlFor={`invite-${index}-email`}>Email</FieldLabel>
                          )}
                          <FieldContent>
                            <Input
                              id={`invite-${index}-email`}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="member@email.com"
                              type="email"
                              required
                            />
                          </FieldContent>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field
                    name={`organizationInvitations[${index}].role`}
                    validators={{ onBlur: roleSchema }}
                  >
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid} className="w-4/12 gap-1">
                          {index === 0 && <FieldLabel>Role</FieldLabel>}
                          <FieldContent>
                            <Select
                              value={field.state.value ?? ""}
                              onValueChange={(newRole) => {
                                const parsed = roleSchema.safeParse(newRole);
                                if (parsed.success) {
                                  field.handleChange(parsed.data);
                                  field.handleBlur();
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((role) => (
                                  <SelectItem
                                    className="text-sm capitalize"
                                    key={role}
                                    value={role}
                                  >
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FieldContent>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <div className="flex w-[40px] justify-end">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
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
                  type="button"
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

const createEmptyInviteModel = (): { email: string; role: Role } => ({
  email: "",
  role: "member",
});

const useInviteMembers = (organizationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: z.infer<typeof inviteMembersSchema>) => {
      const invitationPromises = data.organizationInvitations.map((invite) =>
        authClient.organization.inviteMember({
          email: invite.email,
          role: invite.role,
          organizationId,
        }),
      );

      await Promise.all(invitationPromises);
    },
    onSuccess: async () => {
      toast.success("Invitations sent successfully");
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
