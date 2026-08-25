import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";

export default async function CertificatesPage() {
  const profile = await getAuthedProfile();
  const supabase = await createServerSupabase();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `id, course_id, courses ( title, slug, modules ( id, lessons ( id ) ) )`,
    )
    .eq("user_id", profile.id)
    .eq("status", "active");

  const cleaned = (enrollments || []).map((e) => {
    const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
    const totalLessons =
      course?.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;
    return {
      enrollmentId: e.id,
      courseId: e.course_id,
      courseTitle: course?.title || "Untitled",
      courseSlug: course?.slug || "",
      totalLessons,
    };
  });

  const enrollmentIds = cleaned.map((c) => c.enrollmentId);

  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("enrollment_id")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : [""])
    .eq("status", "completed");

  const completedCount: Record<string, number> = {};
  (completedRows || []).forEach((r) => {
    completedCount[r.enrollment_id] =
      (completedCount[r.enrollment_id] || 0) + 1;
  });

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, course_id")
    .in(
      "course_id",
      cleaned.map((c) => c.courseId),
    );

  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id, status")
    .eq("user_id", profile.id);

  function fullyApproved(courseId: string) {
    const courseAssignments = (assignments || []).filter(
      (a) => a.course_id === courseId,
    );
    if (courseAssignments.length === 0) return true;
    return courseAssignments.every((a) =>
      (submissions || []).some(
        (s) => s.assignment_id === a.id && s.status === "approved",
      ),
    );
  }

  const completedCourses = cleaned.filter(
    (c) =>
      c.totalLessons > 0 &&
      completedCount[c.enrollmentId] === c.totalLessons &&
      fullyApproved(c.courseId),
  );

  const inProgressCourses = cleaned.filter(
    (c) => !completedCourses.some((cc) => cc.enrollmentId === c.enrollmentId),
  );

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <div>
        <p className="text-sm font-mono text-accent mb-1">achievements</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Certificates
        </h1>
      </div>

      {completedCourses.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
          <p className="text-sm text-gray-500">
            No certificates yet — finish a course to earn one.
          </p>
        </div>
      )}

      {completedCourses.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {completedCourses.map((c) => (
            <Link
              key={c.enrollmentId}
              href={`/certificates/${c.courseSlug}`}
              className="rounded-lg border border-border p-5 hover:border-accent transition-colors"
              style={{ boxShadow: "4px 4px 0 var(--color-accent-light)" }}
            >
              <p className="font-medium text-foreground">{c.courseTitle}</p>
              <p className="text-xs font-mono text-accent mt-1">
                View Certificate →
              </p>
            </Link>
          ))}
        </div>
      )}

      {inProgressCourses.length > 0 && (
        <div>
          <p className="text-sm font-mono text-gray-400 mb-3">
            still in progress
          </p>
          <div className="space-y-2">
            {inProgressCourses.map((c) => (
              <div
                key={c.enrollmentId}
                className="px-4 py-3 rounded-md border border-border text-sm text-gray-500"
              >
                {c.courseTitle}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
