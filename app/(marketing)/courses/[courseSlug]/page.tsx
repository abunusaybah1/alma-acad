import { createServerSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { EnrollButton } from "./EnrollButton";
import Image from "next/image";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
      id, title, slug, description, cover_image_url, price_kobo,
      modules ( id, title, position, lessons ( id, short_id, title, position, duration_minutes ) )
      `,
    )
    .eq("slug", courseSlug)
    .eq("status", "published")
    .single();

  if (error || !course) notFound();

  let enrollment = null;
  if (user) {
    const { data } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();
    enrollment = data;
  }

  if (enrollment?.status === "active") {
    const sortedModules = [...course.modules].sort(
      (a, b) => a.position - b.position,
    );
    const flatLessons = sortedModules.flatMap((m) =>
      [...m.lessons].sort((a, b) => a.position - b.position),
    );

    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, status")
      .eq("enrollment_id", enrollment.id)
      .eq("status", "completed");

    const completedIds = new Set((progressRows || []).map((p) => p.lesson_id));
    const resumeLesson =
      flatLessons.find((l) => !completedIds.has(l.id)) ||
      flatLessons[flatLessons.length - 1];

    if (resumeLesson) {
      redirect(`/courses/${courseSlug}/learn/${resumeLesson.short_id}`);
    }
  }

  const sortedModules = [...course.modules]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      ...m,
      lessons: [...m.lessons].sort((a, b) => a.position - b.position),
    }));

  const totalLessons = sortedModules.reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-10">
      {course.cover_image_url ? (
        <Image
          src={course.cover_image_url}
          alt={course.title}
          className="w-full h-64 object-cover rounded-lg border border-border"
          width={1280}
          height={720}
          priority
        />
      ) : (
        <div className="w-full h-64 rounded-lg bg-ink flex items-center justify-center">
          <span className="font-mono text-white/20 text-6xl">{"</>"}</span>
        </div>
      )}

      <div>
        <p className="text-sm font-mono text-accent mb-2">
          {sortedModules.length} modules · {totalLessons} lessons
        </p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {course.title}
        </h1>
        <p className="text-gray-500 mt-3 leading-relaxed whitespace-pre-line">
          {course.description}
        </p>
      </div>

      <div
        className="flex items-center justify-between rounded-lg border border-border px-6 py-5"
        style={{ boxShadow: "4px 4px 0 var(--color-accent-light)" }}
      >
        <span
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {course.price_kobo === 0
            ? "Free"
            : `₦${(course.price_kobo / 100).toLocaleString()}`}
        </span>

        <EnrollButton
          courseId={course.id}
          courseSlug={course.slug}
          priceKobo={course.price_kobo}
          isLoggedIn={!!user}
          pendingPayment={enrollment?.status === "pending_payment"}
        />
      </div>

      <div className="space-y-5">
        <p className="text-sm font-mono text-accent">curriculum</p>
        {sortedModules.map((m, i) => (
          <div key={m.id} className="border-l-2 border-accent pl-5">
            <h3 className="font-semibold text-foreground mb-2">
              <span className="font-mono text-accent text-sm mr-2">
                {String(i + 1).padStart(2, "0")}
              </span>
              {m.title}
            </h3>
            <ul className="space-y-1.5">
              {m.lessons.map((l) => (
                <li
                  key={l.id}
                  className="text-sm text-gray-600 flex justify-between px-4 py-2.5 rounded-md bg-mist"
                >
                  <span>{l.title}</span>
                  {l.duration_minutes && (
                    <span className="font-mono text-gray-400">
                      {l.duration_minutes}min
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
