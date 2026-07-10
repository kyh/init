import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client authenticated with the service-role key.
 * Never import from client components — the key bypasses RLS and storage
 * policies. Browser-side storage access is intentionally unsupported: the
 * app authenticates with better-auth, so Supabase sees browsers as `anon`
 * and cannot scope writes per-user. All storage writes go through route
 * handlers that check the better-auth session first.
 */
export const getSupabaseServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
};
