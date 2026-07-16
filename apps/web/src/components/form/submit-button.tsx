"use client";

import { Button } from "@repo/ui/components/button";

import { useFormContext } from "@/lib/form-context";

/**
 * Submit button bound to the form's `isSubmitting`. Requires the form body to be
 * wrapped in `<form.AppForm>`. Any Button prop passes through, so callers keep
 * control of label, icons, and layout.
 */
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
