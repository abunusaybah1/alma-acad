import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type AuthedProfile = {
  id: string;
  full_name: string | null;
  role: string;
  email: string;
};

/**
 * Fetches the logged-in user + their profile in one call.
 * Redirects to /login if not authenticated.
 * Pass requireRole to also enforce a role check (e.g. ['instructor','admin'])
 * and redirect elsewhere if it fails.
 */
export async function getAuthedProfile(options?: {
  requireRole?: string[];
  redirectOnRoleFail?: string;
}): Promise<AuthedProfile> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  if (options?.requireRole && !options.requireRole.includes(profile.role)) {
    redirect(options.redirectOnRoleFail || "/dashboard");
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    email: user.email || "",
  };
}
