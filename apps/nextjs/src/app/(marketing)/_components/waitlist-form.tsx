"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { joinWaitlistInput } from "@repo/api/waitlist/waitlist-schema";
import { Button } from "@repo/ui/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@repo/ui/field";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { useTRPC } from "@/trpc/react";

export const WaitlistForm = () => {
  const trpc = useTRPC();
  const joinWaitlist = useMutation(trpc.waitlist.join.mutationOptions());

  const form = useForm({
    resolver: zodResolver(joinWaitlistInput),
    defaultValues: {
      email: "",
    },
  });

  const handleJoinWaitlist = form.handleSubmit((values) => {
    toast.promise(
      joinWaitlist.mutateAsync({ email: values.email }).then(() => {
        form.reset({ email: "" });
      }),
      {
        loading: "Submitting...",
        success: "Waitlist joined!",
        error: "Failed to join waitlist",
      },
    );
  });

  return (
    <form
      onSubmit={handleJoinWaitlist}
      className="bg-input mt-10 flex max-w-sm items-center gap-2 rounded-xl border border-white/10 shadow-lg"
    >
      <Field
        data-invalid={Boolean(form.formState.errors.email)}
        className="relative min-w-0 flex-1"
      >
        <FieldLabel className="sr-only" htmlFor="waitlist-email">
          Email
        </FieldLabel>
        <FieldContent>
          <input
            id="waitlist-email"
            className="w-full border-none bg-transparent py-3 pl-4 text-sm placeholder-white/50 focus:placeholder-white/75 focus:ring-0 focus:outline-hidden"
            required
            type="email"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            {...form.register("email")}
            value={form.watch("email") ?? ""}
          />
        </FieldContent>
        <FieldError className="absolute left-0 top-full pt-1">
          {form.formState.errors.email?.message}
        </FieldError>
      </Field>
      <Button
        className={cn(
          "text-xs",
          joinWaitlist.isPending && "[&>:first-child]:bg-input",
        )}
        variant="ghost"
        loading={joinWaitlist.isPending}
      >
        Join Waitlist
      </Button>
    </form>
  );
};
