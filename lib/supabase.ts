import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !rawSupabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Copy into explicitly narrowed constants so strict TypeScript keeps the
// non-null guarantee inside exported functions/closures as well.
const supabaseUrl: string = rawSupabaseUrl;
const supabaseAnonKey: string = rawSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Privileged server client. Commerce P0 intentionally requires the service role
 * instead of silently falling back to the public anon key.
 */
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Server routes require an explicit service role key."
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
