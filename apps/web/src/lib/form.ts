"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "@/lib/form-context";
import { SelectField } from "@/components/form/select-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";

/**
 * App-wide TanStack Form hook with pre-bound field components. Prefer this over
 * `useForm` from @tanstack/react-form directly: the field components derive
 * invalid state, wire ids/labels, and normalize validator errors internally, so
 * a form body becomes `<form.AppField name="…">{(f) => <f.TextField label="…" />}`.
 *
 * @see https://tanstack.com/form/latest/docs/framework/react/guides/form-composition
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
  },
  formComponents: {
    SubmitButton,
  },
});
