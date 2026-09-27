import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NewThreadForm } from "@/components/forum/NewThreadForm";

export default async function NewCourseThreadPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  await getAuthedProfile();
  const { courseSlug } = await params;
  const supabase = await createServerSupabase();

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", courseSlug)
    .single();
  if (!course) notFound();

  return (
    <div className="max-w-2xl mx-auto py-14 px-6 space-y-6">
      <Link
        href={`/courses/${courseSlug}/forum`}
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← Forum
      </Link>
      <h1
        className="text-2xl font-semibold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        New Thread
      </h1>
      <NewThreadForm
        courseId={course.id}
        redirectBasePath={`/courses/${courseSlug}/forum`}
      />
    </div>
  );
}
