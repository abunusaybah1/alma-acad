import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ThreadDetail } from "@/components/forum/ThreadDetail";

export default async function CourseThreadPage({
  params,
}: {
  params: Promise<{ courseSlug: string; threadId: string }>;
}) {
  const profile = await getAuthedProfile();
  const { courseSlug, threadId } = await params;
  const supabase = await createServerSupabase();

  const { data: thread } = await supabase
    .from("discussion_threads")
    .select("id, title, locked")
    .eq("id", threadId)
    .is("archived_at", null)
    .single();

  if (!thread) notFound();

  const { data: replies } = await supabase
    .from("discussion_replies")
    .select(`id, body, created_at, user_id, profiles ( full_name )`)
    .eq("thread_id", threadId)
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  const cleanedReplies = (replies || []).map((r) => {
    const author = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      authorName:
        r.user_id === profile.id ? "You" : author?.full_name || "Unknown",
    };
  });

  const isModerator = profile.role === "instructor" || profile.role === "admin";

  return (
    <div className="max-w-2xl mx-auto py-14 px-6 space-y-6">
      <Link
        href={`/courses/${courseSlug}/forum`}
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← Forum
      </Link>
      <ThreadDetail
        threadId={thread.id}
        title={thread.title}
        locked={thread.locked}
        replies={cleanedReplies}
        isModerator={isModerator}
      />
    </div>
  );
}
