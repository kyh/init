"use client";

import { joinWaitlistInput } from "@repo/api/waitlist/waitlist-schema";
import { Button } from "@repo/ui/components/button";
import { Field, FieldContent, FieldError, FieldLabel } from "@repo/ui/components/field";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

import { useTRPC } from "@/trpc/react";

export const WaitlistForm = () => {
  const trpc = useTRPC();
  const joinWaitlist = useMutation(trpc.waitlist.join.mutationOptions());

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: joinWaitlistInput,
    },
    onSubmit: ({ value, formApi }) => {
      toast.promise(
        joinWaitlist.mutateAsync({ email: value.email }).then(() => {
          formApi.reset({ email: "" });
        }),
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
      <form.Field
        name="email"
        validators={{
          onBlur: joinWaitlistInput.shape.email,
        }}
      >
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <Field data-invalid={isInvalid} className="relative min-w-0 flex-1">
              <FieldLabel className="sr-only" htmlFor="waitlist-email">
                Email
              </FieldLabel>
              <FieldContent>
                <input
                  id="waitlist-email"
                  className="text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent py-3 pl-4 text-sm focus:ring-0 focus:outline-hidden"
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  required
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                />
              </FieldContent>
              {isInvalid && (
                <FieldError
                  className="absolute left-0 top-full pt-1"
                  errors={field.state.meta.errors}
                />
              )}
            </Field>
          );
        }}
      </form.Field>
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
