import { createServerSupabase } from "@/lib/supabase/server";
import { StudentDirectory } from "./StudentDirectory";

export default async function AdminStudentsPage() {
  const supabase = await createServerSupabase();

  const { data: students } = await supabase
    .from("profiles")
    .select(
      `
      id, short_id, full_name, bio, github_username, created_at,
      enrollments ( id, status, course_id, courses ( title ) )
    `,
    )
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const cleaned = (students || []).map((s) => ({
    id: s.id,
    short_id: s.short_id,
    full_name: s.full_name,
    bio: s.bio,
    github_username: s.github_username,
    created_at: s.created_at,
    enrollments: s.enrollments.map((e) => {
      const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
      return {
        id: e.id,
        status: e.status,
        courseTitle: c?.title || "Unknown course",
      };
    }),
  }));

  return <StudentDirectory students={cleaned} />;
}
