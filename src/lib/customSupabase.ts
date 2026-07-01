import { createClient } from "@supabase/supabase-js";

export const CUSTOM_SUPABASE_URL =
  (import.meta.env.VITE_CUSTOM_SUPABASE_URL as string | undefined) ??
  "https://udpfnmycqkmwpzrujoqu.supabase.co";

const CUSTOM_SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";

if (!CUSTOM_SUPABASE_ANON_KEY) {
  // Surface a clear warning during development — calls will fail until the key is provided.
  // eslint-disable-next-line no-console
  console.warn(
    "[customSupabase] VITE_SUPABASE_PUBLISHABLE_KEY is missing. " +
      "Add it to .env.local and restart the dev server.",
  );
}

export const supabase = createClient(
  CUSTOM_SUPABASE_URL,
  CUSTOM_SUPABASE_ANON_KEY || "placeholder-anon-key",
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);

/**
 * Call an edge function on the custom Supabase project.
 * Automatically attaches the current user's JWT (when signed in).
 */
export async function callEdgeFunction<T = unknown>(
  name: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
  } = {},
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const url = new URL(`${CUSTOM_SUPABASE_URL}/functions/v1/${name}`);
    if (options.query) {
      Object.entries(options.query).forEach(([k, v]) =>
        url.searchParams.set(k, v),
      );
    }
    const res = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: CUSTOM_SUPABASE_ANON_KEY,
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: new Error(text || `HTTP ${res.status}`) };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e as Error };
  }
}
