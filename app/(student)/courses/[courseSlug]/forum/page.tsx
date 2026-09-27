import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ThreadList } from "@/components/forum/ThreadList";
import { Pagination } from "@/components/forum/Pagination";

const PAGE_SIZE = 15;

export default async function CourseForumPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getAuthedProfile();
  const { courseSlug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const supabase = await createServerSupabase();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("slug", courseSlug)
    .single();
  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment && profile.role === "student")
    redirect(`/courses/${courseSlug}`);

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: threads, count } = await supabase
    .from("discussion_threads")
    .select(
      `id, title, created_at, locked, profiles ( full_name ), discussion_replies ( id )`,
      {
        count: "exact",
      },
    )
    .eq("course_id", course.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  const cleaned = (threads || []).map((t) => {
    const author = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    return {
      id: t.id,
      title: t.title,
      created_at: t.created_at,
      locked: t.locked,
      authorName: author?.full_name || "Unknown",
      replyCount: (t.discussion_replies || []).length,
    };
  });

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-6">
      <Link
        href={`/courses/${courseSlug}`}
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← {course.title}
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-mono text-accent mb-1">course forum</p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {course.title}
          </h1>
        </div>
        <Link
          href={`/courses/${courseSlug}/forum/new`}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
        >
          New Thread
        </Link>
      </div>
      <ThreadList
        threads={cleaned}
        basePath={`/courses/${courseSlug}/forum`}
        emptyMessage="No threads yet — start the first one."
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/courses/${courseSlug}/forum`}
      />
    </div>
  );
}
