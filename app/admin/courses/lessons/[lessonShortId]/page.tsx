import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LessonEditor } from "./LessonEditor";

export default async function LessonEditPage({
  params,
}: {
  params: Promise<{ lessonShortId: string }>;
}) {
  const { lessonShortId } = await params;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("lessons")
    .select(
      `
    id, short_id, title, content_type, video_url, body_content, duration_minutes,
    module_id,
    modules ( id, title, course_id, courses ( id, slug, title ) ),
    lesson_resources ( id, title, file_url, file_type )
  `,
    )
    .eq("short_id", lessonShortId)
    .single();

  if (error || !data) {
    notFound();
  }

  // Supabase infers joined foreign-key relations as arrays even when
  // they're one-to-one, so unwrap them here into single objects
  // before handing off to the client component.
  const rawModule = Array.isArray(data.modules)
    ? data.modules[0]
    : data.modules;
  const rawCourse = Array.isArray(rawModule?.courses)
    ? rawModule.courses[0]
    : rawModule?.courses;

  if (!rawModule || !rawCourse) {
    notFound();
  }

  const lesson = {
    id: data.id,
    title: data.title,
    content_type: data.content_type,
    video_url: data.video_url,
    body_content: data.body_content,
    duration_minutes: data.duration_minutes,
    module_id: data.module_id,
    modules: {
      id: rawModule.id,
      title: rawModule.title,
      course_id: rawModule.course_id,
      courses: {
        id: rawCourse.id,
        slug: rawCourse.slug, 
        title: rawCourse.title,
      },
    },
    lesson_resources: data.lesson_resources,
  };

  return <LessonEditor lesson={lesson} />;
}
