"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

type Assignment = {
  id: string;
  title: string;
  instructions_markdown: string | null;
  submission_type: string;
};

type Submission = {
  id: string;
  content: string | null;
  file_url: string | null;
  status: string;
  mentor_feedback: string | null;
  submitted_at: string;
} | null;

export function AssignmentSection({
  assignment,
  existingSubmission,
  githubUsername,
  onSubmissionChange,
}: {
  assignment: Assignment;
  existingSubmission: Submission;
  githubUsername: string | null;
  onSubmissionChange?: (submission: Submission) => void;
}) {
  const supabase = createClient();
  const [repoName, setRepoName] = useState("");
  const [freeTextContent, setFreeTextContent] = useState(
    existingSubmission?.content || "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(existingSubmission);
  const [error, setError] = useState<string | null>(null);

  function isValidUrl(value: string) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  async function handleSubmit() {
    setError(null);
    let finalContent = "";

    if (assignment.submission_type === "github_link") {
      if (!githubUsername) {
        setError("Add your GitHub username in your profile first.");
        return;
      }
      if (!repoName.trim()) {
        setError("Enter your repository name.");
        return;
      }
      finalContent = `https://github.com/${githubUsername}/${repoName.trim()}`;
    } else if (assignment.submission_type === "file_upload") {
      if (!freeTextContent.trim() || !isValidUrl(freeTextContent.trim())) {
        setError("Please enter a valid URL.");
        return;
      }
      finalContent = freeTextContent.trim();
    } else {
      if (!freeTextContent.trim()) {
        setError("This field is required.");
        return;
      }
      finalContent = freeTextContent.trim();
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setSubmitting(false);
      return;
    }

    const { data, error: submitError } = await supabase
      .from("submissions")
      .upsert(
        {
          assignment_id: assignment.id,
          user_id: user.id,
          content: finalContent,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "assignment_id,user_id" },
      )
      .select()
      .single();

    setSubmitting(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    setSubmission(data);
    onSubmissionChange?.(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment: {assignment.title}</CardTitle>
      </CardHeader>

      {assignment.instructions_markdown && (
        <div
          className="prose max-w-none mb-4"
          dangerouslySetInnerHTML={{ __html: assignment.instructions_markdown }}
        />
      )}

      {submission && (
        <div className="mb-4 p-3 rounded-md bg-accent-light/40 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground">
              Your submission
            </span>
            <StatusBadge status={submission.status} />
          </div>
          <a
            href={submission.content || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline break-all whitespace-pre-line"
          >
            {submission.content}
          </a>
          {submission.status !== "approved" && (
            <p className="text-xs text-amber-700 mt-2">
              Awaiting mentor review. You can continue to the next lesson while
              you wait.
            </p>
          )}
          {submission.mentor_feedback && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Mentor feedback
              </p>
              <p className="text-sm text-foreground">
                {submission.mentor_feedback}
              </p>
            </div>
          )}
        </div>
      )}

      {(!submission || submission.status === "needs_revision") && (
        <div className="space-y-3">
          {assignment.submission_type === "github_link" ? (
            <Input
              id="repo-name"
              label="GitHub Repository Name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-project"
              hint={
                githubUsername
                  ? `Will submit as github.com/${githubUsername}/${repoName || "..."}`
                  : "Add your GitHub username in your profile first"
              }
            />
          ) : assignment.submission_type === "file_upload" ? (
            <Input
              id="file-url"
              label="File URL"
              value={freeTextContent}
              onChange={(e) => setFreeTextContent(e.target.value)}
              placeholder="https://..."
            />
          ) : (
            <Textarea
              id="submission-content"
              label="Your Submission"
              value={freeTextContent}
              onChange={(e) => setFreeTextContent(e.target.value)}
            />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? "Submitting..."
              : submission
                ? "Resubmit"
                : "Submit Assignment"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    submitted: "bg-gray-100 text-gray-600",
    reviewed: "bg-accent-light text-accent",
    needs_revision: "bg-amber-100 text-amber-700",
    approved: "bg-accent-light text-accent",
  };
  const labels: Record<string, string> = {
    submitted: "Pending Review",
    reviewed: "Reviewed",
    needs_revision: "Needs Revision",
    approved: "Approved",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
