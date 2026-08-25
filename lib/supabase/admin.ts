import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — BYPASSES ALL RLS POLICIES.
 *
 * ONLY use this in:
 *   - app/api/webhooks/paystack/route.ts   (after verifying signature)
 *   - app/api/ai/ingest/route.ts           (lesson chunking/embedding)
 *   - app/api/certificates/verify/route.ts (single-record lookup by code)
 *
 * Never import this into a client component, a page rendered for
 * a logged-in user, or anywhere reachable without a server-side
 * trust boundary already established (signature check, admin role
 * check, etc). This key can read/write every row in every org.
 */
export function createAdminSupabase() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminSupabase() called in browser context — this must never happen.",
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
