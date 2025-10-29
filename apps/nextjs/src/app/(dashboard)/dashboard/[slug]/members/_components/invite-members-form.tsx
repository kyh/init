"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@repo/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { toast } from "@repo/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/tooltip";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
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
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon className="mr-1 size-4" />
          <span>Invite Members</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Members to your Organization</DialogTitle>
          <DialogDescription>
            Invite members to your organization by entering their email and
            role.
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

const inviteMembersSchema = z.object({
  organizationInvitations: z.array(
    z.object({
      email: z.email("Invalid email address"),
      role: z.enum(["owner", "admin", "member"]),
    }),
  ),
});

type InviteMembersFormProps = {
  slug: string;
  onInviteSuccess?: () => void;
};

export const InviteMembersForm = ({
  slug,
  onInviteSuccess,
}: InviteMembersFormProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
  const { mutateAsync: inviteMembers, isPending: isInvitingMembers } =
    useInviteMembers(organizationData.organization.id);

  const form = useForm({
    resolver: zodResolver(inviteMembersSchema),
    defaultValues: {
      organizationInvitations: [createEmptyInviteModel()],
    },
  });

  const fieldArray = useFieldArray({
    name: "organizationInvitations",
    control: form.control,
  });

  const handleInviteMembers = form.handleSubmit(async (data) => {
    await inviteMembers(data);
    form.reset();
    onInviteSuccess?.();
  });

  return (
    <form onSubmit={handleInviteMembers}>
      <div className="flex flex-col gap-2">
        {fieldArray.fields.map((field, index) => {
          const emailInputName =
            `organizationInvitations.${index}.email` as const;
          const roleInputName =
            `organizationInvitations.${index}.role` as const;
          const emailError =
            form.formState.errors.organizationInvitations?.[index]?.email?.message;
          const roleError =
            form.formState.errors.organizationInvitations?.[index]?.role?.message;

          return (
            <div key={field.id} className="flex items-end gap-2">
              <Field
                data-invalid={Boolean(emailError)}
                className="w-7/12 gap-1"
              >
                {index === 0 && (
                  <FieldLabel htmlFor={`invite-${index}-email`}>
                    Email
                  </FieldLabel>
                )}
                <FieldContent>
                  <Input
                    id={`invite-${index}-email`}
                    placeholder="member@email.com"
                    type="email"
                    required
                    {...form.register(emailInputName)}
                  />
                </FieldContent>
                <FieldError>{emailError}</FieldError>
              </Field>
              <Field
                data-invalid={Boolean(roleError)}
                className="w-4/12 gap-1"
              >
                {index === 0 && <FieldLabel>Role</FieldLabel>}
                <FieldContent>
                  <Select
                    value={form.watch(roleInputName) ?? ""}
                    onValueChange={(newRole) =>
                      form.setValue(
                        roleInputName,
                        newRole as "owner" | "admin" | "member",
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                        },
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["owner", "admin", "member"].map((role) => (
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
                <FieldError>{roleError}</FieldError>
              </Field>
              <div className="flex w-[40px] justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      disabled={fieldArray.fields.length <= 1}
                      aria-label="Remove invite"
                      onClick={() => {
                        fieldArray.remove(index);
                        form.clearErrors(emailInputName);
                      }}
                    >
                      <XIcon className="h-4 lg:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove invite</TooltipContent>
                </Tooltip>
              </div>
              </div>
            );
          })}
          {fieldArray.fields.length < MAX_INVITES && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fieldArray.append(createEmptyInviteModel())}
            >
              <PlusIcon className="mr-1 h-3" />
              <span>Add another one</span>
            </Button>
          )}
        </div>
        <Button
          className="mt-5 w-full"
          type="submit"
          loading={isInvitingMembers}
        >
          Send Invites
        </Button>
      </div>
    </form>
  );
};

const createEmptyInviteModel = () => ({
  email: "",
  role: "member" as const,
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
