import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";

export default async function ForumHubPage() {
  const profile = await getAuthedProfile();
  const supabase = await createServerSupabase();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`id, courses ( title, slug )`)
    .eq("user_id", profile.id)
    .eq("status", "active");

  const courses = (enrollments || [])
    .map((e) => (Array.isArray(e.courses) ? e.courses[0] : e.courses))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <div>
        <p className="text-sm font-mono text-accent mb-1">community</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Forum
        </h1>
      </div>

      <div>
        <p className="text-sm font-mono text-gray-400 mb-3">general</p>
        <Link
          href="/forum/general"
          className="flex items-center justify-between px-5 py-4 rounded-lg border border-border hover:border-accent transition-colors"
        >
          <div>
            <p className="font-medium text-foreground">General Discussion</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Open to everyone enrolled in at least one course.
            </p>
          </div>
          <span className="text-accent">→</span>
        </Link>
      </div>

      <div>
        <p className="text-sm font-mono text-gray-400 mb-3">your courses</p>

        {courses.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Enroll in a course to see and start threads for it.
            </p>
            <Link
              href="/courses"
              className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors inline-block"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {courses.map((c) => (
              <Link
                key={c.slug}
                href={`/courses/${c.slug}/forum`}
                className="flex items-center justify-between px-5 py-4 rounded-lg border border-border hover:border-accent transition-colors"
              >
                <p className="font-medium text-foreground">{c.title}</p>
                <span className="text-accent">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
