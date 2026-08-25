import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";
import Image from "next/image";
import { CourseActionsMenu } from "./CourseActionsMenu";

export default async function AdminCoursesPage() {
  const profile = await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });

  const supabase = await createServerSupabase();

  let query = supabase
    .from("courses")
    .select(
      `id, title, slug, status, price_kobo, cover_image_url, created_at, modules ( id, lessons ( id ) )`,
    )
    .order("created_at", { ascending: false });

  if (profile.role === "instructor") {
    query = query.eq("instructor_id", profile.id);
  }

  const { data, error } = await query;
  const courses = (data || []).map((c) => ({
    ...c,
    moduleCount: c.modules?.length || 0,
    lessonCount: c.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0,
  }));

  const statusStyles: Record<string, string> = {
    published: "bg-accent-light text-accent border-accent/20",
    archived: "bg-gray-100 text-gray-500 border-gray-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="max-w-5xl mx-auto py-14 px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-mono text-accent mb-1">admin</p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Manage Courses
          </h1>
        </div>
        <Link
          href="/admin/courses/new"
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-center"
        >
          New Course
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Something went wrong loading courses.
        </p>
      )}

      {!error && courses.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            You haven&apos;t created any courses yet.
          </p>
          <Link
            href="/admin/courses/new"
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors inline-block"
          >
            Create Your First Course
          </Link>
        </div>
      )}

      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-lg border border-border overflow-hidden relative"
            >
              <Link
                href={
                  course.status === "published"
                    ? `/courses/${course.slug}`
                    : `/admin/courses/${course.slug}/edit`
                }
                className="block"
              >
                {course.cover_image_url ? (
                  <div className="relative w-full h-36">
                    <Image
                      src={course.cover_image_url}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-36 bg-ink flex items-center justify-center">
                    <span className="font-mono text-white/20 text-3xl">
                      {"</>"}
                    </span>
                  </div>
                )}
              </Link>

              <div className="absolute top-3 right-3">
                <CourseActionsMenu courseSlug={course.slug} />
              </div>

              <div className="p-4">
                <Link
                  href={
                    course.status === "published"
                      ? `/courses/${course.slug}`
                      : `/admin/courses/${course.slug}/edit`
                  }
                  className="flex items-center gap-2 mb-1.5 hover:text-accent transition-colors"
                >
                  <h3 className="font-medium text-foreground truncate">
                    {course.title}
                  </h3>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${statusStyles[course.status]}`}
                  >
                    {course.status}
                  </span>
                </Link>
                <p className="text-sm text-gray-500 font-mono">
                  {course.moduleCount} mod · {course.lessonCount} lessons ·{" "}
                  {course.price_kobo === 0
                    ? "FREE"
                    : `₦${(course.price_kobo / 100).toLocaleString()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
