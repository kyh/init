"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/** Separate from form.ts to avoid a cycle through the bound field components. */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
