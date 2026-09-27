"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function CourseActionsMenu({
  courseSlug,
  archived,
}: {
  courseSlug: string;
  archived?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleArchive() {
    if (
      !confirm(
        "Archive this course? Students won't see it, but you can restore it anytime.",
      )
    )
      return;
    const { data: course, error: fetchError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (fetchError || !course) {
      alert(`Couldn't find course: ${fetchError?.message}`);
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", course.id);

    if (error) {
      alert(`Couldn't archive course: ${error.message}`);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleRestore() {
    if (
      !confirm("Restore this course? It'll become visible to students again.")
    )
      return;

    const { data: course, error: fetchError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (fetchError || !course) {
      alert(`Couldn't find course: ${fetchError?.message}`);
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({ archived_at: null })
      .eq("id", course.id);

    if (error) {
      alert(`Couldn't restore course: ${error.message}`);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center border border-border hover:border-accent transition-colors"
        aria-label="Course actions"
      >
        <DotsIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-20 w-44 rounded-md border border-border bg-background shadow-lg overflow-hidden">
          <Link
            href={`/courses/${courseSlug}`}
            className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent-light transition-colors"
          >
            View Course
          </Link>
          <Link
            href={`/admin/courses/${courseSlug}/edit`}
            className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent-light transition-colors"
          >
            Edit Course
          </Link>
          <Link
            href={`/admin/courses/${courseSlug}/submissions`}
            className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent-light transition-colors"
          >
            Submissions
          </Link>
          {archived ? (
            <button
              onClick={handleRestore}
              className="border-t border-border block w-full text-left px-4 py-2.5 text-sm text-accent hover:bg-accent-light transition-colors"
            >
              Restore Course
            </button>
          ) : (
            <button
              onClick={handleArchive}
              className="border-t border-t-red-200 block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Archive Course
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
