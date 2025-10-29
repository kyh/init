"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
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
    <Form {...form}>
      <form onSubmit={handleInviteMembers}>
        <div className="flex flex-col gap-2">
          {fieldArray.fields.map((field, index) => {
            const emailInputName =
              `organizationInvitations.${index}.email` as const;
            const roleInputName =
              `organizationInvitations.${index}.role` as const;

            return (
              <div key={field.id} className="flex items-end gap-2">
                <FormField
                  name={emailInputName}
                  render={({ field }) => {
                    return (
                      <FormItem className="w-7/12">
                        {index === 0 && <FormLabel>Email</FormLabel>}
                        <FormControl>
                          <Input
                            placeholder="member@email.com"
                            type="email"
                            required
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  name={roleInputName}
                  render={({ field }) => {
                    return (
                      <FormItem className="w-4/12">
                        {index === 0 && <FormLabel>Role</FormLabel>}
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(newRole) =>
                              form.setValue(
                                field.name,
                                newRole as "owner" | "admin" | "member",
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
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
      </form>
    </Form>
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
