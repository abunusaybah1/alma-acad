import { createServerSupabase } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";

export default async function CourseCatalogPage() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, slug, description, cover_image_url, price_kobo")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const courses = data || [];

  return (
    <div className="max-w-5xl mx-auto py-14 px-6">
      <p className="text-sm font-mono text-accent mb-2">browse</p>
      <h1
        className="text-3xl font-semibold text-foreground mb-10"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Courses
      </h1>

      {error && (
        <p className="text-sm text-red-600 mb-4">
          Something went wrong loading courses. Please refresh.
        </p>
      )}

      {!error && courses.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-gray-500">
            No courses published yet — check back soon.
          </p>
        </div>
      )}

      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="course-card group block rounded-lg border border-border overflow-hidden"
            >
              {course.cover_image_url ? (
                <div className="relative w-full h-40">
                  <Image
                    src={course.cover_image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-40 bg-ink flex items-center justify-center">
                  <span className="font-mono text-white/20 text-4xl">
                    {"</>"}
                  </span>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 whitespace-pre-line">
                  {course.description}
                </p>
                <p className="text-sm font-mono font-medium text-accent mt-4">
                  {course.price_kobo === 0
                    ? "FREE"
                    : `₦${(course.price_kobo / 100).toLocaleString()}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
