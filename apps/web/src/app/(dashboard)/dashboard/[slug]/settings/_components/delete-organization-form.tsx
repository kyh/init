"use client";

import { useRouter } from "next/navigation";
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
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import type { RouterOutputs } from "@repo/api";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/react";

type Organization = RouterOutputs["organization"]["get"]["organization"];

type DeleteOrganizationFormProps = {
  slug: string;
};

export const DeleteOrganizationForm = ({ slug }: DeleteOrganizationFormProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
  const userIsOwner = organizationData.currentUserMember.role === "owner";

  if (organizationData.organizationMetadata.personal) {
    return null;
  }

  if (userIsOwner) {
    return <Delete organization={organizationData.organization} />;
  }

  return <Leave organization={organizationData.organization} />;
};

type DeleteProps = {
  organization: Organization;
};

const Delete = ({ organization }: DeleteProps) => {
  const { mutateAsync: deleteOrganization, isPending } = useDeleteOrganization(organization.id);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().refine((value) => value === organization.name, {
          message: "Name does not match",
        }),
      }),
    },
    onSubmit: async () => {
      await deleteOrganization();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium">Delete Organization</span>
        <p className="text-muted-foreground text-sm">
          You are about to delete the organization {organization.name}. This action cannot be
          undone.
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
                You are about to delete the organization {organization.name}. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit();
              }}
            >
              <div className="flex flex-col gap-2">
                <div className="mb-4 flex flex-col gap-2 border-2 border-red-500 p-4 text-sm text-red-500">
                  <div>
                    You are deleting the organization {organization.name}. This action cannot be
                    undone.
                  </div>
                  <div className="text-sm">Are you sure you want to continue?</div>
                </div>
                <FieldGroup className="gap-2">
                  <form.Field
                    name="name"
                    validators={{
                      onChange: z.string().refine((value) => value === organization.name, {
                        message: "Name does not match",
                      }),
                    }}
                  >
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                      return (
                        <Field data-invalid={isInvalid} className="gap-1">
                          <FieldLabel htmlFor="delete-organization-name">
                            Organization Name
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="delete-organization-name"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => field.handleChange(event.target.value)}
                              aria-invalid={isInvalid}
                              required
                              type="text"
                              autoComplete="off"
                              className="w-full"
                              placeholder=""
                              pattern={organization.name}
                            />
                          </FieldContent>
                          <FieldDescription>
                            Type the name of the organization to confirm
                          </FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      );
                    }}
                  </form.Field>
                </FieldGroup>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button type="submit" variant="destructive" loading={isPending}>
                  Delete Organization
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

type LeaveProps = {
  organization: Organization;
};

const Leave = ({ organization }: LeaveProps) => {
  const { mutateAsync: leaveOrganization, isPending } = useLeaveOrganization(organization.id);

  const form = useForm({
    defaultValues: {
      confirmation: "",
    },
    validators: {
      onSubmit: z.object({
        confirmation: z.string().refine((value) => value === "LEAVE", {
          message: "Confirmation required to leave organization",
        }),
      }),
    },
    onSubmit: async () => {
      await leaveOrganization();
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Click the button below to leave the organization. Remember, you will no longer have access
        to it and will need to be re-invited to join
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
              You are about to leave this organization. You will no longer have access to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup className="gap-4">
              <form.Field
                name="confirmation"
                validators={{
                  onChange: z.string().refine((value) => value === "LEAVE", {
                    message: "Confirmation required to leave organization",
                  }),
                }}
              >
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid} className="gap-1">
                      <FieldLabel htmlFor="leave-organization-confirmation">
                        Please type LEAVE to confirm leaving the organization.
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="leave-organization-confirmation"
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={isInvalid}
                          type="text"
                          className="w-full"
                          autoComplete="off"
                          placeholder=""
                          pattern="LEAVE"
                          required
                        />
                      </FieldContent>
                      <FieldDescription>
                        By leaving the organization, you will no longer have access to it.
                      </FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button type="submit" loading={isPending} variant="destructive">
                Leave Organization
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const useDeleteOrganization = (organizationId: string) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await authClient.organization.delete({
        organizationId,
      });
    },
    onSuccess: () => {
      toast.success("Organization successfully deleted");
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useLeaveOrganization = (organizationId: string) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await authClient.organization.leave({
        organizationId,
      });
    },
    onSuccess: () => {
      toast.success("Organization successfully left");
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
