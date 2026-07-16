"use client";

import { joinWaitlistInput } from "@repo/api/waitlist/waitlist-schema";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";

import { useAppForm } from "@/lib/form";
import { useTRPC } from "@/trpc/react";

export const WaitlistForm = () => {
  const trpc = useTRPC();
  const joinWaitlist = useMutation(trpc.waitlist.join.mutationOptions());

  const form = useAppForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: joinWaitlistInput,
    },
    onSubmit: ({ value, formApi }) => {
      toast.promise(
        joinWaitlist.mutateAsync({ email: value.email }).then(() => formApi.reset({ email: "" })),
        {
          loading: "Submitting...",
          success: "Waitlist joined!",
          error: "Failed to join waitlist",
        },
      );
    },
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
      className="border-border/50 mt-10 flex max-w-sm items-center gap-2 rounded-[0.75rem] border bg-transparent shadow-sm"
    >
      <form.AppField
        name="email"
        validators={{
          onBlur: joinWaitlistInput.shape.email,
        }}
      >
        {(field) => (
          <field.TextField
            label="Email"
            labelClassName="sr-only"
            type="email"
            required
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            className="relative min-w-0 flex-1"
            inputClassName="h-auto rounded-none border-0 bg-transparent py-3 pl-4 shadow-none focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
            errorClassName="absolute left-0 top-full pt-1"
          />
        )}
      </form.AppField>
      <Button
        type="submit"
        variant="ghost"
        className={cn(
          "rounded-[0.375rem] px-4 py-2 text-xs hover:bg-transparent hover:text-current dark:hover:bg-transparent",
          joinWaitlist.isPending && "[&>:first-child]:bg-input",
        )}
        loading={joinWaitlist.isPending}
      >
        Join Waitlist
      </Button>
    </form>
  );
};
