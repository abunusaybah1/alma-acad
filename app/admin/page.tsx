import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const profile = await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });

  const supabase = await createServerSupabase();

  let courseQuery = supabase.from("courses").select("id, title, status");
  if (profile.role === "instructor") {
    courseQuery = courseQuery.eq("instructor_id", profile.id);
  }
  const { data: courses } = await courseQuery;

  const courseIds = (courses || []).map((c) => c.id);
  const publishedCount = (courses || []).filter(
    (c) => c.status === "published",
  ).length;

  const { count: studentCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "student");

  // pending submissions across this instructor's courses
  const { data: pendingSubmissions } = await supabase
    .from("submissions")
    .select(
      `
      id, content, submitted_at,
      user_id, profiles ( full_name ),
      assignment_id, assignments ( title, course_id )
      `,
    )
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  const filteredPending = (pendingSubmissions || []).filter((s) => {
    const a = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
    return courseIds.includes(a?.course_id);
  });

  const cleanedPending = filteredPending.slice(0, 6).map((s) => {
    const profileData = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const a = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
    return {
      id: s.id,
      studentName: profileData?.full_name || "Unknown",
      assignmentTitle: a?.title || "Untitled",
      courseId: a?.course_id,
      submittedAt: s.submitted_at,
    };
  });

  return (
    <div className="max-w-4xl mx-auto py-14 px-6 space-y-10">
      <div>
        <p className="text-sm font-mono text-accent mb-1">admin</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
          {profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Courses" value={courses?.length || 0} />
        <StatCard label="Published" value={publishedCount} />
        <StatCard label="Students" value={studentCount || 0} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Needs Review
          </h2>
          {filteredPending.length > 0 && (
            <span className="text-xs font-mono text-gray-400">
              {filteredPending.length} pending
            </span>
          )}
        </div>

        {cleanedPending.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-sm text-gray-500">
              Nothing waiting on review right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {cleanedPending.map((s) => (
              <Link
                key={s.id}
                href={`/admin/courses/${s.courseId}/submissions`}
                className="flex items-center justify-between px-5 py-3.5 rounded-lg border border-border hover:border-accent transition-colors"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {s.studentName} submitted &quot;{s.assignmentTitle}&quot;
                  </p>
                </div>
                <span className="text-xs font-mono text-gray-400 whitespace-nowrap ml-4">
                  {new Date(s.submittedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/courses/new"
          className="rounded-lg border border-border p-5 hover:border-accent transition-colors"
        >
          <p className="font-medium text-foreground">Create a course</p>
          <p className="text-sm text-gray-500 mt-1">
            Start a new track from scratch.
          </p>
        </Link>
        <Link
          href="/admin/students"
          className="rounded-lg border border-border p-5 hover:border-accent transition-colors"
        >
          <p className="font-medium text-foreground">View students</p>
          <p className="text-sm text-gray-500 mt-1">
            See who&apos;s enrolled and their progress.
          </p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-5 text-center bg-background">
      <p
        className="text-3xl font-semibold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
