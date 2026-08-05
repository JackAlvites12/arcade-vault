import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  }
  if (!publishableKey) {
    throw new Error(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createClient(url, publishableKey, {
    auth: { flowType: "pkce" },
  });
}

let browserClient: SupabaseClient | undefined;

/**
 * Single shared client for "use client" components. Supabase-js manages
 * session refresh via a browser lock keyed by storageKey; multiple
 * instances contending for that lock is what causes signIn/getSession to
 * hang indefinitely.
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) browserClient = createSupabaseClient();
  return browserClient;
}
