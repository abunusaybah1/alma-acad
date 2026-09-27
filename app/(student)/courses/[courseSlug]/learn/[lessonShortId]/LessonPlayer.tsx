"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { AssignmentSection } from "./AssignmentSection";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";

type Resource = {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
};

type Lesson = {
  id: string;
  short_id: string;
  title: string;
  content_type: string;
  video_url: string | null;
  body_content: string | null;
  duration_minutes: number | null;
  lesson_resources: Resource[];
};

type SiblingLesson = { id: string; title: string; short_id: string } | null;

type AssignmentType = {
  id: string;
  title: string;
  instructions_markdown: string | null;
  submission_type: string;
} | null;

type SubmissionType = {
  id: string;
  content: string | null;
  file_url: string | null;
  status: string;
  mentor_feedback: string | null;
  submitted_at: string;
} | null;

export function LessonPlayer({
  lesson,
  courseSlug,
  courseTitle,
  enrollmentId,
  progressStatus,
  prevLesson,
  nextLesson,
  assignment,
  existingSubmission,
  githubUsername,
}: {
  lesson: Lesson;
  courseSlug: string;
  courseTitle: string;
  enrollmentId: string;
  progressStatus: string;
  prevLesson: SiblingLesson;
  nextLesson: SiblingLesson;
  assignment: AssignmentType;
  existingSubmission: SubmissionType;
  githubUsername: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(progressStatus);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState(existingSubmission);
  const [gateError, setGateError] = useState<string | null>(null);

  async function markComplete() {
    setGateError(null);

    if (status === "completed") {
      if (nextLesson) {
        router.push(`/courses/${courseSlug}/learn/${nextLesson.short_id}`);
      }
      return;
    }

    // just needs a submission to exist — approval isn't required to move on
    if (assignment && !submission) {
      setGateError(
        "Submit this lesson's assignment before marking it complete."
      );
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("lesson_progress").upsert(
      {
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      },
      { onConflict: "enrollment_id,lesson_id" }
    );

    setSaving(false);
    if (!error) {
      setStatus("completed");
      if (nextLesson) {
        router.push(`/courses/${courseSlug}/learn/${nextLesson.short_id}`);
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push(`/courses/${courseSlug}`)}
            className="text-sm text-gray-500 hover:text-accent"
          >
            ← {courseTitle}
          </button>
          <Link
            href={`/courses/${courseSlug}/forum`}
            className="text-sm bg-accent text-white px-3 py-1 rounded-md transition-colors"
          >
            Course Forum
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {lesson.title}
          </h1>
          {status === "completed" && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent-light text-accent">
              Completed
            </span>
          )}
        </div>
        {lesson.duration_minutes && (
          <p className="text-sm text-gray-500 mt-1">
            {lesson.duration_minutes} min
          </p>
        )}
      </div>

      {(lesson.content_type === "video" || lesson.content_type === "mixed") &&
        lesson.video_url && (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <iframe
              src={lesson.video_url}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

      {(lesson.content_type === "text" || lesson.content_type === "mixed") &&
        lesson.body_content && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(lesson.body_content),
            }}
          />
        )}

      {lesson.lesson_resources.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">
            Resources
          </h3>
          <div className="space-y-2">
            {lesson.lesson_resources.map((r) => (
              <a
                key={r.id}
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm px-3 py-2 rounded-md border border-border text-accent hover:bg-accent-light transition-colors"
              >
                {r.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {assignment && (
        <AssignmentSection
          assignment={assignment}
          existingSubmission={submission}
          githubUsername={githubUsername}
          onSubmissionChange={setSubmission}
        />
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          {prevLesson && (
            <Button
              onClick={() =>
                router.push(
                  `/courses/${courseSlug}/learn/${prevLesson.short_id}`,
                )
              }
            >
              Previous
            </Button>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {gateError && (
            <p className="text-sm text-red-600 text-right max-w-xs">
              {gateError}
            </p>
          )}
          <Button onClick={markComplete} disabled={saving}>
            {saving
              ? "Saving..."
              : status === "completed"
                ? nextLesson
                  ? "Next Lesson"
                  : "Course Complete"
                : "Mark lesson & continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}