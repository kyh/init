"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@repo/api/auth/utils";
import { Button } from "@repo/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/react";

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
});

type UpdateOrganizationFormProps = {
  slug: string;
};

export const UpdateOrganizationForm = ({ slug }: UpdateOrganizationFormProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );

  const { mutateAsync: updateOrganization, isPending } = useUpdateOrganization(
    organizationData.organization.id,
  );

  const form = useForm({
    defaultValues: {
      name: organizationData.organization.name,
      slug: organizationData.organization.slug ?? "",
    },
    validators: {
      onSubmit: updateOrganizationSchema,
    },
    onSubmit: async ({ value }) => {
      await updateOrganization(value);
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup className="gap-8">
        <form.Field
          name="name"
          validators={{
            onBlur: z.string().min(1, "Name is required"),
          }}
        >
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="gap-1">
                <FieldLabel htmlFor="organization-name">Organization Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="organization-name"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                  />
                </FieldContent>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
        <form.Field
          name="slug"
          validators={{
            onBlur: z.string().min(1, "Slug is required"),
          }}
        >
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid} className="gap-1">
                <FieldLabel htmlFor="organization-slug">Organization URL</FieldLabel>
                <FieldContent>
                  <div className="flex rounded-lg shadow-sm shadow-black/[.04]">
                    <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-s-lg border px-3 text-sm">
                      dashboard/
                    </span>
                    <Input
                      id="organization-slug"
                      className="-ms-px rounded-s-none shadow-none"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={isInvalid}
                    />
                  </div>
                </FieldContent>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>
      <footer className="mt-8 flex justify-end">
        <Button type="submit" loading={isPending}>
          Update Organization
        </Button>
      </footer>
    </form>
  );
};

const useUpdateOrganization = (organizationId: string) => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: z.infer<typeof updateOrganizationSchema>) => {
      const { data: updatedOrganization } = await authClient.organization.update({
        organizationId,
        data: {
          name: data.name,
          slug: slugify(data.slug),
        },
      });

      if (!updatedOrganization) throw new Error("Organization not found");

      return updatedOrganization;
    },
    onSuccess: (updatedOrganization) => {
      toast.success("Organization successfully updated");
      router.replace(`/dashboard/${updatedOrganization.slug}/settings`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
