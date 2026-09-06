"use client";

import { useRouter } from "next/navigation";
import { slugify } from "@repo/api/auth/utils";
import { Button } from "@repo/ui/components/button";
import { FieldGroup } from "@repo/ui/components/field";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useAppForm } from "@/lib/form";
import {
  invalidateOrganization,
  removeOrganization,
  useOrganization,
} from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Validate the normalized slug, which can be empty for non-ASCII input.
  slug: z
    .string()
    .min(1, "Slug is required")
    .refine((value) => slugify(value).length > 0, "Slug must contain a letter or number"),
});

type UpdateOrganizationFormProps = {
  slug: string;
};

export const UpdateOrganizationForm = ({ slug }: UpdateOrganizationFormProps) => {
  const { data: organizationData } = useOrganization(slug);

  const { mutate: updateOrganization, isPending } = useUpdateOrganization(
    slug,
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
    onSubmit: ({ value }) => updateOrganization(value),
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

const useUpdateOrganization = (slug: string, organizationId: string) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof updateOrganizationSchema>) => {
      return authClient.organization.update({
        organizationId,
        fetchOptions: { throw: true },
        data: {
          name: data.name,
          slug: slugify(data.slug),
        },
      });
    },
    onSuccess: async (updatedOrganization) => {
      toast.success("Organization successfully updated");
      if (updatedOrganization.slug === slug) {
        await invalidateOrganization(queryClient, slug);
      } else {
        removeOrganization(queryClient, slug);
      }
      router.replace(`/dashboard/${updatedOrganization.slug}/settings`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
