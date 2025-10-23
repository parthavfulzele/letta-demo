import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedSupabase: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (cachedSupabase) return cachedSupabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service credentials are missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
  }

  cachedSupabase = createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });

  return cachedSupabase;
}
