import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, github_username, role, username, discord_username")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return <ProfileForm profile={profile} email={user.email || ""} />;
}
