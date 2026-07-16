"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/**
 * Field/form contexts for the app form hook. Kept separate from `form.ts` so the
 * field components can read `useFieldContext` without importing the hook that
 * lists them — which would be a cycle.
 */
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();
