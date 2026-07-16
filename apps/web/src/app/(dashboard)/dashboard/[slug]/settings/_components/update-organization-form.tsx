"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@repo/api/auth/utils";
import { Button } from "@repo/ui/components/button";
import { FieldGroup } from "@repo/ui/components/field";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/lib/form";
import { useTRPC } from "@/trpc/react";

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Validate what submit actually sends: the field is slugified on the way out,
  // so a non-empty entry can still reduce to "" and yield an unroutable URL.
  slug: z
    .string()
    .min(1, "Slug is required")
    .refine((value) => slugify(value).length > 0, "Slug must contain a letter or number"),
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

  const form = useAppForm({
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
        <form.AppField
          name="name"
          validators={{
            onBlur: z.string().min(1, "Name is required"),
          }}
        >
          {(field) => <field.TextField label="Organization Name" />}
        </form.AppField>
        <form.AppField
          name="slug"
          validators={{
            onBlur: z.string().min(1, "Slug is required"),
          }}
        >
          {(field) => (
            <field.TextField
              label="Organization URL"
              inputClassName="-ms-px rounded-s-none shadow-none"
              startAdornment={
                <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-s-lg border px-3 text-sm">
                  dashboard/
                </span>
              }
            />
          )}
        </form.AppField>
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
