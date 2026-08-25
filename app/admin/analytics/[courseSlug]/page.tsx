import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });

  const { courseSlug } = await params;
  const supabase = await createServerSupabase();

  const { data: course } = await supabase
    .from("courses")
    .select(
      `id, title, slug, modules ( id, position, title, lessons ( id, title, position ) )`,
    )
    .eq("slug", courseSlug)
    .single();

  if (!course) notFound();

  const sortedLessons = [...course.modules]
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position));

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", course.id)
    .eq("status", "active");

  const enrolledCount = enrollments?.length || 0;
  const enrollmentIds = (enrollments || []).map((e) => e.id);

  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id, enrollment_id")
    .in("enrollment_id", enrollmentIds.length ? enrollmentIds : [""])
    .eq("status", "completed");

  const completedCountByLesson: Record<string, number> = {};
  (completedRows || []).forEach((r) => {
    completedCountByLesson[r.lesson_id] =
      (completedCountByLesson[r.lesson_id] || 0) + 1;
  });

  const lessonStats = sortedLessons.map((l, i) => {
    const completed = completedCountByLesson[l.id] || 0;
    const percent =
      enrolledCount > 0 ? Math.round((completed / enrolledCount) * 100) : 0;
    return { id: l.id, title: l.title, position: i + 1, completed, percent };
  });

  // biggest single drop between consecutive lessons — the clearest drop-off point
  let biggestDrop = { fromLesson: "", dropPercent: 0 };
  for (let i = 0; i < lessonStats.length - 1; i++) {
    const drop = lessonStats[i].percent - lessonStats[i + 1].percent;
    if (drop > biggestDrop.dropPercent) {
      biggestDrop = { fromLesson: lessonStats[i].title, dropPercent: drop };
    }
  }

  // submission approval rate
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("course_id", course.id);

  const assignmentIds = (assignments || []).map((a) => a.id);

  const { data: submissions } = await supabase
    .from("submissions")
    .select("status")
    .in("assignment_id", assignmentIds.length ? assignmentIds : [""]);

  const submissionCounts = {
    total: submissions?.length || 0,
    approved: (submissions || []).filter((s) => s.status === "approved").length,
    needsRevision: (submissions || []).filter(
      (s) => s.status === "needs_revision",
    ).length,
    pending: (submissions || []).filter((s) => s.status === "submitted").length,
  };

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <Link
        href="/admin/analytics"
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← All Analytics
      </Link>

      <div>
        <p className="text-sm font-mono text-accent mb-1">
          {enrolledCount} enrolled
        </p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {course.title}
        </h1>
      </div>

      {biggestDrop.dropPercent > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Biggest drop-off: {biggestDrop.dropPercent}% of students stop right
          after <strong>&quot;{biggestDrop.fromLesson}&quot;</strong>
        </div>
      )}

      <div>
        <p className="text-sm font-mono text-accent mb-4">lesson completion</p>
        <div className="space-y-3">
          {lessonStats.map((l) => (
            <div key={l.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">
                  <span className="font-mono text-accent mr-2">
                    {String(l.position).padStart(2, "0")}
                  </span>
                  {l.title}
                </span>
                <span className="font-mono text-gray-500">
                  {l.completed}/{enrolledCount} · {l.percent}%
                </span>
              </div>
              <div className="w-full bg-mist rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{ width: `${l.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {submissionCounts.total > 0 && (
        <div>
          <p className="text-sm font-mono text-accent mb-4">submissions</p>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Approved" value={submissionCounts.approved} />
            <StatCard
              label="Needs Revision"
              value={submissionCounts.needsRevision}
            />
            <StatCard label="Pending" value={submissionCounts.pending} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4 text-center">
      <p
        className="text-2xl font-semibold text-foreground"
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
