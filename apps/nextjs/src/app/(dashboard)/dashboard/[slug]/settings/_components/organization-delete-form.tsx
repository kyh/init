"use client";

import type { Member, Organization } from "better-auth/plugins";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { authMetadataSchema } from "@repo/api/auth/auth-schema";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/alert-dialog";
import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Session } from "@repo/api/auth/auth";
import { authClient } from "@/auth/auth-client";

type OrganizationDeleteFormProps = {
  user: Session["user"];
  organization: Organization & {
    members: Member[];
  };
};

export const OrganizationDeleteForm = ({
  user,
  organization,
}: OrganizationDeleteFormProps) => {
  const userIsOwner =
    organization.members.find((member) => member.userId === user.id)?.role ===
    "owner";

  if (userIsOwner) {
    return <Delete organization={organization} />;
  }

  return <Leave organization={organization} />;
};

type DeleteProps = {
  organization: OrganizationDeleteFormProps["organization"];
};

const Delete = ({ organization }: DeleteProps) => {
  const router = useRouter();

  const form = useForm({
    mode: "onChange",
    reValidateMode: "onChange",
    resolver: zodResolver(
      z.object({
        name: z.string().refine((value) => value === organization.name, {
          message: "Name does not match",
          path: ["name"],
        }),
      }),
    ),
    defaultValues: {
      name: "",
    },
  });

  const handleDelete = form.handleSubmit(async () => {
    await authClient.organization.delete({
      organizationId: organization.id,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Organization successfully deleted");
          router.replace("/dashboard");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium">Delete Organization</span>
        <p className="text-muted-foreground text-sm">
          You are about to delete the organization {organization.name}. This
          action cannot be undone.
        </p>
      </div>
      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive">
              Delete Organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deleting organization</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete the organization {organization.name}.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Form {...form}>
              <form className="flex flex-col gap-4" onSubmit={handleDelete}>
                <div className="flex flex-col gap-2">
                  <div className="mb-4 flex flex-col gap-2 border-2 border-red-500 p-4 text-sm text-red-500">
                    <div>
                      You are deleting the organization {organization.name}.
                      This action cannot be undone.
                    </div>
                    <div className="text-sm">
                      Are you sure you want to continue?
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input
                            required
                            type="text"
                            autoComplete="off"
                            className="w-full"
                            placeholder=""
                            pattern={organization.name}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Type the name of the organization to confirm
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    type="submit"
                    variant="destructive"
                    loading={form.formState.isSubmitting}
                  >
                    Delete Organization
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

type LeaveProps = {
  organization: OrganizationDeleteFormProps["organization"];
};

const Leave = ({ organization }: LeaveProps) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        confirmation: z.string().refine((value) => value === "LEAVE", {
          message: "Confirmation required to leave organization",
          path: ["confirmation"],
        }),
      }),
    ),
    defaultValues: {
      confirmation: "",
    },
  });

  const handleLeave = form.handleSubmit(async () => {
    await authClient.organization.leave({
      organizationId: organization.id,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Organization successfully left");
          router.replace("/dashboard");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Click the button below to leave the organization. Remember, you will no
        longer have access to it and will need to be re-invited to join
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive">
            Leave Organization
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leaving Organization</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave this organization. You will no longer have
              access to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={handleLeave}>
              <FormField
                control={form.control}
                name="confirmation"
                render={({ field }) => {
                  return (
                    <FormItem>
                      <FormLabel>
                        Please type LEAVE to confirm leaving the organization.
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          className="w-full"
                          autoComplete="off"
                          placeholder=""
                          pattern="LEAVE"
                          required
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        By leaving the organization, you will no longer have
                        access to it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  type="submit"
                  loading={form.formState.isSubmitting}
                  variant="destructive"
                >
                  Leave Organization
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
