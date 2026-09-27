"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Reply = {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
};

export function ThreadDetail({
  threadId,
  title,
  locked: initialLocked,
  replies: initialReplies,
  isModerator,
}: {
  threadId: string;
  title: string;
  locked: boolean;
  replies: Reply[];
  isModerator: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [replies, setReplies] = useState(initialReplies);
  const [locked, setLocked] = useState(initialLocked);
  const [newReply, setNewReply] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply() {
    if (!newReply.trim()) return;
    setPosting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setPosting(false);
      return;
    }

    const { data, error: replyError } = await supabase
      .from("discussion_replies")
      .insert({ thread_id: threadId, user_id: user.id, body: newReply.trim() })
      .select()
      .single();

    setPosting(false);

    if (replyError) {
      setError(replyError.message);
      return;
    }

    setReplies([
      ...replies,
      {
        id: data.id,
        body: data.body,
        created_at: data.created_at,
        authorName: "You",
      },
    ]);
    setNewReply("");
  }

  async function toggleLock() {
    const { error } = await supabase
      .from("discussion_threads")
      .update({ locked: !locked })
      .eq("id", threadId);
    if (!error) setLocked(!locked);
  }

 async function archiveThread() {
   if (!confirm("Archive this thread? It'll be hidden from the forum.")) return;

   const { error } = await supabase
     .from("discussion_threads")
     .update({ archived_at: new Date().toISOString() })
     .eq("id", threadId);

   if (error) {
     alert(`Couldn't archive thread: ${error.message}`);
     return;
   }

   router.back();
 }

  async function archiveReply(replyId: string) {
    if (!confirm("Remove this reply?")) return;
    const { error } = await supabase
      .from("discussion_replies")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", replyId);
    if (!error) setReplies(replies.filter((r) => r.id !== replyId));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          {locked && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 mt-2 inline-block">
              locked — no new replies
            </span>
          )}
        </div>
        {isModerator && (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={toggleLock}
              className="text-sm text-accent hover:underline"
            >
              {locked ? "Unlock" : "Lock"}
            </button>
            <button
              onClick={archiveThread}
              className="text-sm text-red-600 hover:underline"
            >
              Archive
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {replies.map((r, i) => (
          <div key={r.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {r.authorName}
              </span>
              <span className="text-xs font-mono text-gray-400">
                {new Date(r.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-line">
              {r.body}
            </p>
            {isModerator && i > 0 && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => archiveReply(r.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!locked ? (
        <div className="rounded-lg border border-border p-5 space-y-3">
          <Textarea
            id="new-reply"
            label="Reply"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            rows={3}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleReply} disabled={posting}>
            {posting ? "Posting..." : "Post Reply"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          This thread is locked.
        </p>
      )}
    </div>
  );
}
