"use client";

import { Field, FieldContent, FieldError, FieldLabel } from "@repo/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/utils";

import { useFieldContext } from "@/lib/form-context";
import { toFieldErrors } from "./field-errors";

type SelectFieldProps = {
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  labelClassName?: string;
  className?: string;
  itemClassName?: string;
};

/**
 * Bound select. `<Select>` has no native onBlur, so the change handler marks the
 * field touched itself — matching how it's wired by hand today. Options come from
 * the field's own value set, so a change is always valid.
 */
export function SelectField({
  label,
  options,
  placeholder,
  labelClassName,
  className,
  itemClassName,
}: SelectFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid} className={cn("gap-1", className)}>
      <FieldLabel htmlFor={field.name} className={labelClassName}>
        {label}
      </FieldLabel>
      <FieldContent>
        <Select
          value={field.state.value ?? ""}
          onValueChange={(value) => {
            if (value === null) return;
            field.handleChange(value);
            field.handleBlur();
          }}
        >
          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} className={itemClassName}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
      {isInvalid ? <FieldError errors={toFieldErrors(field.state.meta.errors)} /> : null}
    </Field>
  );
}
