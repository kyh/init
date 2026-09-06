"use client";

import { Button } from "@repo/ui/components/button";

import { useFormContext } from "@/lib/form-context";

/** Requires a surrounding <form.AppForm>. */
export function SubmitButton({
  children,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "type" | "loading">) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" loading={isSubmitting} {...props}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
