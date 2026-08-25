"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileUpload } from "@/components/ui/FileUpload";

type Resource = {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
};

type Lesson = {
  id: string;
  title: string;
  content_type: string;
  video_url: string | null;
  body_content: string | null;
  duration_minutes: number | null;
  module_id: string;
  modules: {
    id: string;
    title: string;
    course_id: string;
    courses: { id: string; slug: string; title: string };
  };
  lesson_resources: Resource[];
};

export function LessonEditor({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(lesson.title);
  const [contentType, setContentType] = useState(lesson.content_type);
  const [videoUrl, setVideoUrl] = useState(lesson.video_url || "");
  const [bodyContent, setBodyContent] = useState(lesson.body_content || "");
  const [duration, setDuration] = useState(
    lesson.duration_minutes?.toString() || "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [resources, setResources] = useState(lesson.lesson_resources);
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [addingResource, setAddingResource] = useState(false);

  const [assignment, setAssignment] = useState<{
    id: string;
    title: string;
    instructions_markdown: string | null;
    submission_type: string;
  } | null>(null);
  const [assignmentLoaded, setAssignmentLoaded] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignInstructions, setAssignInstructions] = useState("");
  const [assignType, setAssignType] = useState("github_link");
  const [savingAssignment, setSavingAssignment] = useState(false);

  useEffect(() => {
    async function fetchAssignment() {
      const { data } = await supabase
        .from("assignments")
        .select("id, title, instructions_markdown, submission_type")
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      if (data) {
        setAssignment(data);
        setAssignTitle(data.title);
        setAssignInstructions(data.instructions_markdown || "");
        setAssignType(data.submission_type);
      }
      setAssignmentLoaded(true);
    }
    fetchAssignment();
  }, [lesson.id, supabase]);

  function toYouTubeEmbed(url: string) {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/,
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("lessons")
      .update({
        title,
        content_type: contentType,
        video_url: videoUrl ? toYouTubeEmbed(videoUrl) : null,
        body_content: bodyContent || null,
        duration_minutes: duration ? parseInt(duration, 10) : null,
      })
      .eq("id", lesson.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function deleteLesson() {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lesson.id);
    if (!error) {
      router.push(`/admin/courses/${lesson.modules.courses.slug}/edit`);
    } else {
      alert(`Couldn't delete lesson: ${error.message}`);
    }
  }

  async function addResource() {
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    setAddingResource(true);

    const { data, error } = await supabase
      .from("lesson_resources")
      .insert({
        lesson_id: lesson.id,
        title: newResourceTitle,
        file_url: newResourceUrl,
      })
      .select()
      .single();

    setAddingResource(false);

    if (!error && data) {
      setResources([...resources, data]);
      setNewResourceTitle("");
      setNewResourceUrl("");
    }
  }

  async function addResourceFromUpload(title: string, fileUrl: string) {
    const { data, error } = await supabase
      .from("lesson_resources")
      .insert({ lesson_id: lesson.id, title, file_url: fileUrl })
      .select()
      .single();

    if (!error && data) {
      setResources([...resources, data]);
    }
  }

  async function removeResource(id: string) {
    const { error } = await supabase
      .from("lesson_resources")
      .delete()
      .eq("id", id);
    if (!error) setResources(resources.filter((r) => r.id !== id));
  }

  async function saveAssignment() {
    if (!assignTitle.trim()) return;
    setSavingAssignment(true);

    const payload = {
      lesson_id: lesson.id,
      course_id: lesson.modules.course_id,
      title: assignTitle,
      instructions_markdown: assignInstructions || null,
      submission_type: assignType,
    };

    if (assignment) {
      const { error } = await supabase
        .from("assignments")
        .update(payload)
        .eq("id", assignment.id);
      if (!error) setAssignment({ ...assignment, ...payload });
    } else {
      const { data, error } = await supabase
        .from("assignments")
        .insert(payload)
        .select()
        .single();
      if (!error && data) setAssignment(data);
    }

    setSavingAssignment(false);
  }

  async function removeAssignment() {
    if (!assignment) return;
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignment.id);
    if (!error) {
      setAssignment(null);
      setAssignTitle("");
      setAssignInstructions("");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <div>
        <button
          onClick={() =>
            router.push(`/admin/courses/${lesson.modules.courses.slug}/edit`)
          }
          className="text-sm text-gray-500 hover:text-accent transition-colors mb-2"
        >
          ← {lesson.modules.courses.title}
        </button>
        <p className="text-sm font-mono text-accent">{lesson.modules.title}</p>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <p className="text-sm font-mono text-accent">lesson details</p>

        <Input
          id="lesson-title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-1 text-foreground">
            Content Type
          </label>
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="video">Video</option>
            <option value="text">Text</option>
            <option value="mixed">Mixed (video + text)</option>
          </select>
        </div>

        {(contentType === "video" || contentType === "mixed") && (
          <Input
            id="video-url"
            label="YouTube/Vimeo URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtu.be/..."
            hint="Paste a link, or upload a file below instead"
          />
        )}

        {(contentType === "text" || contentType === "mixed") && (
          <RichTextEditor
            content={bodyContent}
            onChange={setBodyContent}
            label="Lesson Content"
          />
        )}

        <Input
          id="duration"
          label="Duration (minutes)"
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Lesson"}
          </Button>
          {saved && (
            <span className="text-sm text-accent font-mono">Saved ✓</span>
          )}
          <Button variant="danger" onClick={deleteLesson} className="ml-auto">
            Delete Lesson
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <p className="text-sm font-mono text-accent">resources</p>
        <div className="space-y-2">
          {resources.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between text-sm px-4 py-2.5 rounded-md border border-border"
            >
              <a
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {r.title}
              </a>
              <button
                onClick={() => removeResource(r.id)}
                className="text-gray-400 hover:text-red-600 text-xs transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          {resources.length === 0 && (
            <p className="text-sm text-gray-400">No resources yet.</p>
          )}
        </div>
        <FileUpload
          bucket="lesson-resources"
          accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
          label="Upload a document or image"
          onUploaded={(url, originalName) =>
            addResourceFromUpload(originalName, url)
          }
        />

        <p className="font-semibold text-sm mb-1">Or add an external link:</p>
        <div className="flex gap-3">
          <Input
            id="resource-title"
            value={newResourceTitle}
            onChange={(e) => setNewResourceTitle(e.target.value)}
            placeholder="Resource Title"
            className="flex-1"
          />
          <Input
            id="resource-url"
            value={newResourceUrl}
            onChange={(e) => setNewResourceUrl(e.target.value)}
            placeholder="Resource link (https://...)"
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={addResource}
            disabled={addingResource}
          >
            Add
          </Button>
        </div>
      </div>

      {assignmentLoaded && (
        <div className="rounded-lg border border-border p-6 space-y-4">
          <p className="text-sm font-mono text-accent">
            assignment {assignment ? "" : "(optional)"}
          </p>

          <Input
            id="assignment-title"
            label="Assignment Title"
            value={assignTitle}
            onChange={(e) => setAssignTitle(e.target.value)}
            placeholder="e.g. Build a Todo App"
          />

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Submission Type
            </label>
            <select
              value={assignType}
              onChange={(e) => setAssignType(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="github_link">GitHub Link</option>
              <option value="file_upload">File Upload</option>
              <option value="text">Text</option>
            </select>
          </div>

          <RichTextEditor
            content={assignInstructions}
            onChange={setAssignInstructions}
            label="Instructions"
          />

          <div className="flex gap-3">
            <Button onClick={saveAssignment} disabled={savingAssignment}>
              {savingAssignment
                ? "Saving..."
                : assignment
                  ? "Update Assignment"
                  : "Create Assignment"}
            </Button>
            {assignment && (
              <Button variant="danger" onClick={removeAssignment}>
                Remove Assignment
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
