"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Submission = {
  id: string;
  content: string | null;
  status: string;
  mentor_feedback: string | null;
  submitted_at: string;
  studentName: string;
  githubUsername: string | null;
  assignmentTitle: string;
};

export function SubmissionsReview({
  courseTitle,
  submissions,
}: {
  courseTitle: string;
  submissions: Submission[];
}) {
  const [items, setItems] = useState(submissions);

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-6">
      <p className="text-sm font-mono text-accent mb-1">admin</p>
      <h1
        className="text-3xl font-semibold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Submissions — {courseTitle}
      </h1>

      {items.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-gray-500">No submissions yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((s) => (
          <SubmissionRow
            key={s.id}
            submission={s}
            onUpdated={(updated) =>
              setItems(items.map((i) => (i.id === s.id ? updated : i)))
            }
          />
        ))}
      </div>
    </div>
  );
}

function SubmissionRow({
  submission,
  onUpdated,
}: {
  submission: Submission;
  onUpdated: (s: Submission) => void;
}) {
  const supabase = createClient();
  const [feedback, setFeedback] = useState(submission.mentor_feedback || "");
  const [saving, setSaving] = useState(false);

  async function updateStatus(status: string) {
    setSaving(true);
    const { error } = await supabase
      .from("submissions")
      .update({
        status,
        mentor_feedback: feedback || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    setSaving(false);
    if (!error) onUpdated({ ...submission, status, mentor_feedback: feedback });
  }

  const statusStyles: Record<string, string> = {
    submitted: "bg-gray-100 text-gray-600 border-gray-200",
    reviewed: "bg-accent-light text-accent border-accent/20",
    needs_revision: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-accent-light text-accent border-accent/20",
  };

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-foreground">
            {submission.studentName}
          </p>
          {submission.githubUsername && (
            <a
              href={`https://github.com/${submission.githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-accent hover:underline"
            >
              @{submission.githubUsername}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {submission.assignmentTitle}
          </p>
        </div>
        <span
          className={`text-xs font-mono px-2 py-1 rounded-full border ${statusStyles[submission.status]}`}
        >
          {submission.status.replace("_", " ")}
        </span>
      </div>

      <a
        href={submission.content || "#"}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-accent hover:underline break-all block mb-4 font-mono"
      >
        {submission.content}
      </a>

      <Textarea
        id={`feedback-${submission.id}`}
        label="Feedback"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
      />

      {submission.status !== "approved" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => updateStatus("approved")}
            disabled={saving}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateStatus("needs_revision")}
            disabled={saving}
          >
            Request Revision
          </Button>
        </div>
      )}
      {submission.status === "approved" && (
        <p className="text-xs text-accent font-mono mt-3">
          Approved
        </p>
      )}
    </div>
  );
}
