import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * RLS-respecting server client — use this everywhere in server
 * components, route handlers, and server actions. It acts as
 * whichever user is logged in (or anon), so every query is subject
 * to the policies we wrote (role checks, ownership checks, etc).
 *
 * Never use this for webhook handlers or the ingestion pipeline —
 * use lib/supabase/admin.ts for those instead.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component during render — safe to
            // ignore if middleware is refreshing the session
          }
        },
      },
    },
  );
}
