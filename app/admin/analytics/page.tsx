import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";

export default async function AnalyticsOverviewPage() {
  const profile = await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });

  const supabase = await createServerSupabase();

  let courseQuery = supabase
    .from("courses")
    .select(`id, title, slug, status, modules ( id, lessons ( id ) )`);

  if (profile.role === "instructor") {
    courseQuery = courseQuery.eq("instructor_id", profile.id);
  }

  const { data: courses } = await courseQuery;
  const courseList = courses || [];
  const courseIds = courseList.map((c) => c.id);

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, user_id, status")
    .in("course_id", courseIds.length ? courseIds : [""])
    .eq("status", "active");

  const enrollmentIds = (enrollments || []).map((e) => e.id);

  const { data: completedProgress } = await supabase
    .from("lesson_progress")
    .select("enrollment_id")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : [""])
    .eq("status", "completed");

  const completedCountByEnrollment: Record<string, number> = {};
  (completedProgress || []).forEach((p) => {
    completedCountByEnrollment[p.enrollment_id] =
      (completedCountByEnrollment[p.enrollment_id] || 0) + 1;
  });

  // same "fully approved" definition used on the student dashboard —
  // completion means every assignment for the course has an approved
  // submission from that specific student, not just 100% lesson progress
  const { data: allAssignments } = await supabase
    .from("assignments")
    .select("id, course_id")
    .in("course_id", courseIds.length ? courseIds : [""]);

  const { data: allSubmissions } = await supabase
    .from("submissions")
    .select("assignment_id, user_id, status")
    .in(
      "user_id",
      (enrollments || []).map((e) => e.user_id),
    );

  function courseFullyApproved(courseId: string, userId: string) {
    const courseAssignments = (allAssignments || []).filter(
      (a) => a.course_id === courseId,
    );
    if (courseAssignments.length === 0) return true; // no assignments = nothing to approve
    return courseAssignments.every((a) =>
      (allSubmissions || []).some(
        (s) =>
          s.assignment_id === a.id &&
          s.user_id === userId &&
          s.status === "approved",
      ),
    );
  }

  const stats = courseList.map((course) => {
    const totalLessons =
      course.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
    const courseEnrollments = (enrollments || []).filter(
      (e) => e.course_id === course.id,
    );

    const percentages = courseEnrollments.map((e) => {
      const completed = completedCountByEnrollment[e.id] || 0;
      return totalLessons > 0 ? (completed / totalLessons) * 100 : 0;
    });

    const avgProgress = percentages.length
      ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
      : 0;

    const fullyCompleted = courseEnrollments.filter((e, i) => {
      return (
        percentages[i] === 100 && courseFullyApproved(course.id, e.user_id)
      );
    }).length;

    const completionRate = courseEnrollments.length
      ? Math.round((fullyCompleted / courseEnrollments.length) * 100)
      : 0;

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      enrolledCount: courseEnrollments.length,
      avgProgress,
      completionRate,
      totalLessons,
    };
  });

  return (
    <div className="max-w-4xl mx-auto py-14 px-6 space-y-8">
      <div>
        <p className="text-sm font-mono text-accent mb-1">admin</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Analytics
        </h1>
      </div>

      {stats.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-gray-500">
            No courses to show analytics for yet.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {stats.map((s) => (
          <Link
            key={s.id}
            href={`/admin/analytics/${s.slug}`}
            className="block rounded-lg border border-border p-5 hover:border-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">{s.title}</h3>
              <span className="text-xs font-mono text-gray-400">
                {s.enrolledCount} enrolled
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Avg. Progress</span>
                  <span className="font-mono">{s.avgProgress}%</span>
                </div>
                <div className="w-full bg-mist rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-1.5 rounded-full"
                    style={{ width: `${s.avgProgress}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Completion Rate</span>
                  <span className="font-mono">{s.completionRate}%</span>
                </div>
                <div className="w-full bg-mist rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-1.5 rounded-full"
                    style={{ width: `${s.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
