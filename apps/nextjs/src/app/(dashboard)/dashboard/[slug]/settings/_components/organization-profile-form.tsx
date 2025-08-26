"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { slugify } from "@repo/api/auth/utils";
import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useOrganization } from "@/app/(dashboard)/_components/use-organization";
import { authClient } from "@/auth/auth-client";

type OrganizationProfileFormProps = {
  slug: string;
};

export const OrganizationProfileForm = ({
  slug,
}: OrganizationProfileFormProps) => {
  const router = useRouter();
  const { data: organization } = useOrganization(slug);

  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
      }),
    ),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });

  const handleUpdateOrganization = form.handleSubmit(async (data) => {
    await authClient.organization.update({
      organizationId: organization.id,
      data: {
        name: data.name,
        slug: slugify(data.slug),
      },
      fetchOptions: {
        onSuccess: () => {
          toast.success("Organization successfully updated");
          router.replace(`/dashboard/${data.slug}/settings`);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleUpdateOrganization} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <Input required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization URL</FormLabel>
              <FormControl>
                <div className="flex rounded-lg shadow-sm shadow-black/[.04]">
                  <span className="border-input bg-background text-muted-foreground -z-10 inline-flex items-center rounded-s-lg border px-3 text-sm">
                    dashboard/
                  </span>
                  <Input
                    className="-ms-px rounded-s-none shadow-none"
                    required
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <footer className="flex justify-end">
          <Button type="submit" loading={form.formState.isSubmitting}>
            Update Organization
          </Button>
        </footer>
      </form>
    </Form>
  );
};
