import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";
import { ThreadList } from "@/components/forum/ThreadList";
import { Pagination } from "@/components/forum/Pagination";

const PAGE_SIZE = 15;

export default async function GeneralForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await getAuthedProfile();
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const supabase = await createServerSupabase();

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
    .is("course_id", null)
    .is("lesson_id", null)
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
        href="/forum"
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← Forum
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-mono text-accent mb-1">general</p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            General Discussion
          </h1>
        </div>
        <Link
          href="/forum/general/new"
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
        >
          New Thread
        </Link>
      </div>

      <ThreadList
        threads={cleaned}
        basePath="/forum/general"
        emptyMessage="No threads yet — start the first one."
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/forum/general"
      />
    </div>
  );
}
