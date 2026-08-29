import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read from Vite environment variables (publicly safe)
const supabaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
  "";

const supabaseAnonKey =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SUPABASE_ANON_KEY) ||
  "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("https://"));
};

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return clientInstance;
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Initiates Google OAuth sign-in via Supabase
 */
export async function signInWithGoogleViaSupabase(redirectTo?: string) {
  const sb = getSupabase();
  if (!sb) {
    throw new Error(
      "Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }

  const redirectUrl =
    redirectTo ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined);

  const { data, error } = await sb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Signs out from Supabase Auth
 */
export async function signOutSupabase() {
  const sb = getSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
}
