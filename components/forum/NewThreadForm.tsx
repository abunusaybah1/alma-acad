"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export function NewThreadForm({
  courseId,
  redirectBasePath,
}: {
  courseId: string | null;
  redirectBasePath: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Both a title and a message are required.");
      return;
    }
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const { data: thread, error: threadError } = await supabase
      .from("discussion_threads")
      .insert({ title: title.trim(), course_id: courseId, user_id: user.id })
      .select()
      .single();

    if (threadError || !thread) {
      setSaving(false);
      setError(threadError?.message || "Something went wrong.");
      return;
    }

    const { error: replyError } = await supabase
      .from("discussion_replies")
      .insert({
        thread_id: thread.id,
        user_id: user.id,
        body: body.trim(),
      });

    setSaving(false);

    if (replyError) {
      setError(replyError.message);
      return;
    }

    router.push(`${redirectBasePath}/${thread.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="thread-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What's your question or topic?"
      />
      <Textarea
        id="thread-body"
        label="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "Posting..." : "Start Thread"}
      </Button>
    </form>
  );
}
