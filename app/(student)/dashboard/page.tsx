import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await getAuthedProfile();
  const supabase = await createServerSupabase();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      id, status, enrolled_at, course_id,
      courses ( id, title, slug, cover_image_url,
        modules ( id, lessons ( id ) )
      )
      `,
    )
    .eq("user_id", profile.id)
    .order("enrolled_at", { ascending: false });

  const cleanedEnrollments = (enrollments || []).map((e) => {
    const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
    const totalLessons =
      course?.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
    return {
      enrollmentId: e.id,
      status: e.status,
      courseId: course?.id,
      courseTitle: course?.title || "Untitled",
      courseSlug: course?.slug || "",
      totalLessons,
    };
  });

  const enrollmentIds = cleanedEnrollments.map((e) => e.enrollmentId);
  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("enrollment_id, status")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : [""])
    .eq("status", "completed");

  const completedCounts: Record<string, number> = {};
  (progressRows || []).forEach((p) => {
    completedCounts[p.enrollment_id] =
      (completedCounts[p.enrollment_id] || 0) + 1;
  });

  const activeCourses = cleanedEnrollments
    .filter((e) => e.status === "active")
    .map((e) => {
      const completed = completedCounts[e.enrollmentId] || 0;
      const percent =
        e.totalLessons > 0 ? Math.round((completed / e.totalLessons) * 100) : 0;
      return { ...e, completed, percent };
    });

  const { data: recentSubmissions } = await supabase
    .from("submissions")
    .select(
      `
      id, status, submitted_at,
      assignments ( title, courses ( title, slug ) )
      `,
    )
    .eq("user_id", profile.id)
    .order("submitted_at", { ascending: false })
    .limit(5);

  const { data: recentCompletions } = await supabase
    .from("lesson_progress")
    .select(
      `
      id, completed_at,
      lessons ( title, modules ( courses ( title, slug ) ) ),
      enrollments!inner ( user_id )
      `,
    )
    .eq("enrollments.user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  const { data: allAssignments } = await supabase
    .from("assignments")
    .select("id, course_id")
    .in(
      "course_id",
      activeCourses.map((c) => c.courseId),
    );

  const { data: allSubmissions } = await supabase
    .from("submissions")
    .select("assignment_id, status")
    .eq("user_id", profile.id);

  function courseFullyApproved(courseId: string) {
    const courseAssignments = (allAssignments || []).filter(
      (a) => a.course_id === courseId,
    );
    if (courseAssignments.length === 0) return true; // no assignments = nothing to approve
    return courseAssignments.every((a) =>
      (allSubmissions || []).some(
        (s) => s.assignment_id === a.id && s.status === "approved",
      ),
    );
  }

  const completedCourses = activeCourses.filter(
    (c) => c.percent === 100 && courseFullyApproved(c.courseId),
  );
  const inProgress = activeCourses.filter(
    (c) => c.percent < 100 || !courseFullyApproved(c.courseId),
  );

  type Activity = {
    id: string;
    label: string;
    detail: string;
    timestamp: string;
  };

 const submissionActivity: Activity[] = (recentSubmissions || []).map((s) => {
   const a = Array.isArray(s.assignments) ? s.assignments[0] : s.assignments;
   return {
     id: s.id,
     label:
       s.status === "needs_revision"
         ? `"${a?.title || "assignment"}" needs revision`
         : `Submitted "${a?.title || "assignment"}"`,
     detail:
       s.status === "approved"
         ? "Approved"
         : s.status === "needs_revision"
           ? "Needs revision"
           : "Pending review",
     timestamp: s.submitted_at,
   };
 });

  const completionActivity: Activity[] = (recentCompletions || []).map((p) => {
    const lesson = Array.isArray(p.lessons) ? p.lessons[0] : p.lessons;
    const mod = lesson?.modules
      ? Array.isArray(lesson.modules)
        ? lesson.modules[0]
        : lesson.modules
      : null;
    const c = mod?.courses
      ? Array.isArray(mod.courses)
        ? mod.courses[0]
        : mod.courses
      : null;
    return {
      id: p.id,
      label: `Completed "${lesson?.title || "a lesson"}"`,
      detail: c?.title || "",
      timestamp: p.completed_at,
    };
  });

  const activity = [...submissionActivity, ...completionActivity]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12">
      <div>
        <p className="text-sm font-mono text-accent mb-1">dashboard</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Welcome back
          {profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.
        </h1>
      </div>

      {/* stats — hard offset cards instead of flat boxes */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Enrolled" value={activeCourses.length} />
        <StatCard label="In Progress" value={inProgress.length} />
        <StatCard label="Completed" value={completedCourses.length} />
      </div>

      {/* continue learning */}
      <div>
        <h2
          className="text-lg font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Continue Learning
        </h2>

        {inProgress.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              You&apos;re not currently enrolled in any courses.
            </p>
            <Link
              href="/courses"
              className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors inline-block"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {inProgress.map((c) => (
              <Link
                key={c.enrollmentId}
                href={`/courses/${c.courseSlug}`}
                className="group rounded-lg border border-border p-5 hover:border-accent transition-colors"
              >
                <p className="font-medium text-foreground mb-3">
                  {c.courseTitle}
                </p>
                <div className="w-full bg-mist rounded-full h-1.5 mb-2 overflow-hidden">
                  <div
                    className="bg-accent h-1.5 rounded-full transition-all group-hover:brightness-110"
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
                <p className="text-xs font-mono text-gray-500">
                  {c.completed}/{c.totalLessons} lessons · {c.percent}%
                </p>
              </Link>
            ))}
          </div>
        )}

        {inProgress.length > 0 && (
          <Link
            href="/courses"
            className="text-sm text-accent hover:underline mt-4 inline-block"
          >
            Browse more courses
          </Link>
        )}
      </div>

      {completedCourses.length > 0 && (
        <div>
          <h2
            className="text-lg font-semibold text-foreground mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Completed
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {completedCourses.map((c) => (
              <Link
                key={c.enrollmentId}
                href={`/courses/${c.courseSlug}`}
                className="rounded-lg border border-border p-5 hover:border-accent transition-colors flex items-center justify-between"
              >
                <p className="font-medium text-foreground">{c.courseTitle}</p>
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-accent-light text-accent border border-accent/20">
                  100%
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* activity feed — timeline style instead of flat rows */}
      <div>
        <h2
          className="text-lg font-semibold text-foreground mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Recent Activity
        </h2>

        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing yet — start a lesson to see activity here.
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-1.25 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {activity.map((a) => (
              <div key={a.id} className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background" />
                <p className="text-sm text-foreground">{a.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {a.detail && (
                    <span className="text-xs text-gray-500">{a.detail}</span>
                  )}
                  <span className="text-xs font-mono text-gray-400">
                    {new Date(a.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
