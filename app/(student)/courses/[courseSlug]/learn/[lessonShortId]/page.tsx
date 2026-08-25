import { createServerSupabase } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { LessonPlayer } from "./LessonPlayer";

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonShortId: string }>;
}) {
  const { courseSlug, lessonShortId } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("github_username")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
      id, short_id, title, content_type, video_url, body_content, duration_minutes, position,
      module_id,
      modules ( id, title, course_id, courses ( id, slug, title ) ),
      lesson_resources ( id, title, file_url, file_type )
    `,
    )
    .eq("short_id", lessonShortId)
    .single();
  // console.log("Error:", error);

  if (error || !data) notFound();
  const lessonId = data.id;

  const mod = Array.isArray(data.modules) ? data.modules[0] : data.modules;
  const course = Array.isArray(mod?.courses) ? mod.courses[0] : mod?.courses;

  if (!mod || !course || course.slug !== courseSlug) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  if (!enrollment || enrollment.status !== "active") {
    redirect(`/courses/${courseSlug}`);
  }

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("id, status")
    .eq("enrollment_id", enrollment.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  // fetch assignment tied to this lesson (if any) + student's existing submission
  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, instructions_markdown, submission_type")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  let existingSubmission = null;
  if (assignment) {
    const { data: sub } = await supabase
      .from("submissions")
      .select("id, content, file_url, status, mentor_feedback, submitted_at")
      .eq("assignment_id", assignment.id)
      .eq("user_id", user.id)
      .maybeSingle();
    existingSubmission = sub;
  }

  const { data: allModules } = await supabase
    .from("modules")
    .select("id, position, lessons ( id, short_id, title, position )")
    .eq("course_id", course.id)
    .order("position");

  const flatLessons = (allModules || [])
    .flatMap((m) => [...m.lessons].sort((a, b) => a.position - b.position))
    .map((l) => ({ id: l.id, title: l.title, short_id: l.short_id }));

  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const lesson = {
    id: data.id,
    short_id: data.short_id,
    title: data.title,
    content_type: data.content_type,
    video_url: data.video_url,
    body_content: data.body_content,
    duration_minutes: data.duration_minutes,
    lesson_resources: data.lesson_resources,
  };

  return (
    <LessonPlayer
      lesson={lesson}
      courseSlug={courseSlug}
      courseTitle={course.title}
      enrollmentId={enrollment.id}
      progressStatus={progress?.status || "not_started"}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      assignment={assignment}
      existingSubmission={existingSubmission}
      githubUsername={studentProfile?.github_username}
    />
  );
}
