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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/auth/auth-client";
import { useTRPC } from "@/trpc/react";

type UpdateOrganizationFormProps = {
  slug: string;
};

export const UpdateOrganizationForm = ({
  slug,
}: UpdateOrganizationFormProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
  const { mutate: updateOrganization } = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      await authClient.organization.update({
        organizationId: organizationData.organization.id,
        data: {
          name: data.name,
          slug: slugify(data.slug),
        },
        fetchOptions: {
          onSuccess: () => {
            toast.success("Organization successfully updated");
            router.replace(`/dashboard/${data.slug}/settings`);
          },
          onError: ({ error }) => {
            toast.error(error.message);
          },
        },
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(
      z.object({
        name: z.string().min(1, "Name is required"),
        slug: z.string().min(1, "Slug is required"),
      }),
    ),
    defaultValues: {
      name: organizationData.organization.name,
      slug: organizationData.organization.slug ?? "",
    },
  });

  const handleUpdateOrganization = form.handleSubmit((data) => {
    updateOrganization(data);
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
