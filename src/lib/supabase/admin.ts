import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";

export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) return null;

  try {
    return createClient(getSupabaseUrl(), key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export function hasSupabaseAdmin(): boolean {
  return getSupabaseAdmin() !== null;
}
