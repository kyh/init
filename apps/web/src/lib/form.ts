"use client";

import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "@/lib/form-context";
import { SelectField } from "@/components/form/select-field";
import { SubmitButton } from "@/components/form/submit-button";
import { TextField } from "@/components/form/text-field";

/** Bound fields own labels, validation state and errors. See TanStack Form composition. */
export const { useAppForm } = createFormHook({
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
