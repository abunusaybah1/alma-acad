import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CourseEditor } from "./CourseEditor";

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const supabase = await createServerSupabase();

  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
  id, title, slug, description, status, price_kobo, cover_image_url,
  modules (
    id, title, position,
    lessons ( id, short_id, title, position, content_type, video_url, duration_minutes )
  )
`,
    )
    .eq("slug", courseSlug)
    .single();

  if (error || !course) {
    notFound();
  }

  const sortedCourse = {
    ...course,
    modules: [...course.modules]
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        ...m,
        lessons: [...m.lessons].sort((a, b) => a.position - b.position),
      })),
  };

  return <CourseEditor course={sortedCourse} />;
}
