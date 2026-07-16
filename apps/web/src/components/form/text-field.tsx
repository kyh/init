"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/utils";

import { useFieldContext } from "@/lib/form-context";
import { toFieldErrors } from "./field-errors";

type TextFieldProps = {
  label: string;
  description?: string;
  /** e.g. "sr-only" to keep the label for assistive tech but hide it visually. */
  labelClassName?: string;
  /** Rendered before the input in a flex row — for prefixes like "dashboard/". */
  startAdornment?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  errorClassName?: string;
} & Omit<
  React.ComponentProps<typeof Input>,
  "id" | "name" | "value" | "onChange" | "onBlur" | "className"
>;

/**
 * Bound text input. Derives invalid state, wires id/name/value/handlers to the
 * field, and normalizes validator errors — so a form just supplies `label` and
 * whatever native input props it needs (type, placeholder, required, …).
 */
export function TextField({
  label,
  description,
  labelClassName,
  startAdornment,
  className,
  inputClassName,
  errorClassName,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const input = (
    <Input
      id={field.name}
      name={field.name}
      value={field.state.value ?? ""}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
      aria-invalid={isInvalid}
      className={inputClassName}
      {...inputProps}
    />
  );

  return (
    <Field data-invalid={isInvalid} className={cn("gap-1", className)}>
      <FieldLabel htmlFor={field.name} className={labelClassName}>
        {label}
      </FieldLabel>
      <FieldContent>
        {startAdornment ? (
          <div className="flex rounded-lg shadow-sm shadow-black/[.04]">
            {startAdornment}
            {input}
          </div>
        ) : (
          input
        )}
      </FieldContent>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {isInvalid ? (
        <FieldError className={errorClassName} errors={toFieldErrors(field.state.meta.errors)} />
      ) : null}
    </Field>
  );
}
