"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { FileUpload } from "@/components/ui/FileUpload";
import { Textarea } from "@/components/ui/Textarea";

type Lesson = {
  id: string;
  short_id: string;
  title: string;
  position: number;
  content_type: string;
  video_url: string | null;
  duration_minutes: number | null;
};

type Module = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  price_kobo: number;
  modules: Module[];
  cover_image_url: string | null;
};

export function CourseEditor({ course }: { course: Course }) {
  const router = useRouter();
  const supabase = createClient();
  const [modules, setModules] = useState(course.modules);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [addingModule, setAddingModule] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deletingCourse, setDeletingCourse] = useState(false);
  const [status, setStatus] = useState(course.status);

  const [editingDetails, setEditingDetails] = useState(false);
  const [editTitle, setEditTitle] = useState(course.title);
  const [editDescription, setEditDescription] = useState(
    course.description || "",
  );
  const [editCoverUrl, setEditCoverUrl] = useState(
    course.cover_image_url || "",
  );
  const [editPriceNaira, setEditPriceNaira] = useState(
    String((course.price_kobo || 0) / 100),
  );
  const [savingDetails, setSavingDetails] = useState(false);

  async function saveDetails() {
    setSavingDetails(true);
    const { error } = await supabase
      .from("courses")
      .update({
        title: editTitle,
        description: editDescription || null,
        cover_image_url: editCoverUrl || null,
        price_kobo: Math.round(parseFloat(editPriceNaira || "0") * 100),
      })
      .eq("id", course.id);

    setSavingDetails(false);
    if (!error) setEditingDetails(false);
  }

  async function deleteCourse() {
    if (
      !confirm(
        "Delete this course and everything in it — modules, lessons, submissions, everything? This cannot be undone.",
      )
    )
      return;
    setDeletingCourse(true);
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", course.id);
    setDeletingCourse(false);
    if (!error) {
      router.push("/admin/courses");
    } else {
      alert(`Couldn't delete course: ${error.message}`);
    }
  }

  async function addModule() {
    if (!newModuleTitle.trim()) return;
    setAddingModule(true);

    const { data, error } = await supabase
      .from("modules")
      .insert({
        course_id: course.id,
        title: newModuleTitle,
        position: modules.length,
      })
      .select()
      .single();

    setAddingModule(false);

    if (!error && data) {
      setModules([...modules, { ...data, lessons: [] }]);
      setNewModuleTitle("");
    }
  }

  async function renameModule(moduleId: string, newTitle: string) {
    const { error } = await supabase
      .from("modules")
      .update({ title: newTitle })
      .eq("id", moduleId);
    if (!error) {
      setModules(
        modules.map((m) => (m.id === moduleId ? { ...m, title: newTitle } : m)),
      );
    }
    return !error;
  }

  async function deleteModule(moduleId: string) {
    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);
    if (!error) {
      setModules(modules.filter((m) => m.id !== moduleId));
    }
    return !error;
  }

  async function addLesson(moduleId: string, title: string) {
    const mod = modules.find((m) => m.id === moduleId);
    if (!mod || !title.trim()) return;

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        module_id: moduleId,
        title,
        position: mod.lessons.length,
        content_type: "text",
      })
      .select()
      .single();

    if (!error && data) {
      setModules(
        modules.map((m) =>
          m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m,
        ),
      );
    }
  }

  async function togglePublish() {
    setPublishing(true);
    const newStatus = status === "published" ? "draft" : "published";
    const { error } = await supabase
      .from("courses")
      .update({ status: newStatus })
      .eq("id", course.id);
    setPublishing(false);
    if (!error) setStatus(newStatus);
  }

  const statusStyles: Record<string, string> = {
    published: "bg-accent-light text-accent border-accent/20",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    archived: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <Link
        href="/admin/courses"
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← All Courses
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-mono text-accent mb-1">{course.slug}</p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {course.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded-full border ${statusStyles[status]}`}
          >
            {status}
          </span>
          <Button
            variant={status === "published" ? "secondary" : "primary"}
            onClick={togglePublish}
            disabled={publishing || modules.length === 0}
          >
            {publishing
              ? "Saving..."
              : status === "published"
                ? "Unpublish"
                : "Publish"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-mono text-accent">course details</p>
          {!editingDetails && (
            <button
              onClick={() => setEditingDetails(true)}
              className="text-sm text-accent hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editingDetails ? (
          <>
            <Input
              id="edit-title"
              label="Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <Textarea
              id="edit-desc"
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={4}
            />
            <FileUpload
              bucket="course-covers"
              accept="image/*"
              label="Cover Image"
              currentUrl={editCoverUrl}
              resizeTo={{ width: 1280, height: 720 }}
              onUploaded={(url) => setEditCoverUrl(url)}
            />
            <Input
              id="edit-price"
              label="Price (₦)"
              type="number"
              min="0"
              step="0.01"
              value={editPriceNaira}
              onChange={(e) => setEditPriceNaira(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={saveDetails} disabled={savingDetails}>
                {savingDetails ? "Saving..." : "Save Details"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setEditingDetails(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500 whitespace-pre-line">
            {course.description || "No description yet."}
          </p>
        )}
      </div>

      {modules.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
          <p className="text-sm text-gray-500">
            Add at least one module with a lesson before publishing.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {modules.map((mod, i) => (
          <ModuleCard
            key={mod.id}
            index={i}
            courseModule={mod}
            onAddLesson={(title) => addLesson(mod.id, title)}
            onRename={(newTitle) => renameModule(mod.id, newTitle)}
            onDelete={() => deleteModule(mod.id)}
          />
        ))}
      </div>

      <div
        className="rounded-lg border border-border p-6"
        style={{ boxShadow: "4px 4px 0 var(--color-accent-light)" }}
      >
        <p className="text-sm font-mono text-accent mb-3">add module</p>
        <div className="flex gap-3">
          <Input
            id="new-module"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="e.g. Getting Started"
            className="flex-1"
          />
          <Button onClick={addModule} disabled={addingModule}>
            {addingModule ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-red-200 p-6 space-y-3">
        <p className="text-sm font-mono text-red-600">danger zone</p>
        <p className="text-sm text-gray-500">
          Deleting this course removes all its modules, lessons, submissions,
          and enrollments permanently.
        </p>
        <Button
          variant="danger"
          onClick={deleteCourse}
          disabled={deletingCourse}
        >
          {deletingCourse ? "Deleting..." : "Delete Course"}
        </Button>
      </div>
    </div>
  );
}

function ModuleCard({
  index,
  courseModule,
  onAddLesson,
  onRename,
  onDelete,
}: {
  index: number;
  courseModule: Module;
  onAddLesson: (title: string) => void;
  onRename: (newTitle: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(courseModule.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleRename() {
    if (!titleDraft.trim()) return;
    setSaving(true);
    const ok = await onRename(titleDraft.trim());
    setSaving(false);
    if (ok) setEditingTitle(false);
  }

  async function handleDelete() {
    const hasLessons = courseModule.lessons.length > 0;
    const confirmMsg = hasLessons
      ? `Delete "${courseModule.title}" and its ${courseModule.lessons.length} lesson(s)? This cannot be undone.`
      : `Delete "${courseModule.title}"?`;
    if (!confirm(confirmMsg)) return;
    setDeleting(true);
    await onDelete();
    // no need to setDeleting(false) — component unmounts on success via parent state update
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-accent text-sm shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <Input
              id={`module-title-${courseModule.id}`}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" onClick={handleRename} disabled={saving}>
              {saving ? "..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setTitleDraft(courseModule.title);
                setEditingTitle(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-foreground">
              <span className="font-mono text-accent text-sm mr-2">
                {String(index + 1).padStart(2, "0")}
              </span>
              {courseModule.title}
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingTitle(true)}
                className="text-sm text-accent hover:underline"
              >
                Rename
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="space-y-2 mb-4">
        {courseModule.lessons.map((lesson) => (
          <a
            key={lesson.short_id}
            href={`/admin/courses/lessons/${lesson.short_id}`}
            className="flex items-center justify-between text-sm px-4 py-2.5 rounded-md border border-border hover:border-accent hover:bg-accent-light/40 transition-colors"
          >
            <div>
              <span className="font-mono text-accent text-[0.7rem] mr-2">
                {(lesson.position + 1).toString().padStart(2, "0")}
              </span>
              <span>{lesson.title}</span>
            </div>
            <span className="text-xs font-mono text-gray-400 uppercase">
              {lesson.content_type}
            </span>
          </a>
        ))}
        {courseModule.lessons.length === 0 && (
          <p className="text-sm text-gray-400">No lessons yet.</p>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          id={`new-lesson-${courseModule.id}`}
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          placeholder="Lesson title"
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={() => {
            onAddLesson(newLessonTitle);
            setNewLessonTitle("");
          }}
        >
          Add Lesson
        </Button>
      </div>
    </div>
  );
}
