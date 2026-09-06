import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !rawSupabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

const supabaseUrl: string = rawSupabaseUrl;
const supabaseAnonKey: string = rawSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Explicit privileged client for narrowly-scoped server operations that need
 * to bypass tenant RLS (for example public invitation resolution or Storage
 * after application/RLS authorization has already succeeded).
 *
 * Dashboard data access must use withTenantDb() instead.
 */
export function createServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("Service-role Supabase client is server-only.");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY for an explicitly privileged server operation."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
