import "server-only";

import { createClient } from "@supabase/supabase-js";

/** Service-role access bypasses RLS. Call only after checking the better-auth session. */
export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
