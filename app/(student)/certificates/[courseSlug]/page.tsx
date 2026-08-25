import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound, redirect } from "next/navigation";
import { CertificateView } from "./CertificateView";

export default async function CourseCertificatePage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const profile = await getAuthedProfile();
  const { courseSlug } = await params;
  const supabase = await createServerSupabase();

  const { data: course } = await supabase
    .from("courses")
    .select(
      `id, title, slug, instructor_id, modules ( id, lessons ( id ) ), instructor:profiles!instructor_id ( full_name )`,
    )
    .eq("slug", courseSlug)
    .single();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) redirect("/certificates");

  const totalLessons =
    course.modules?.reduce((sum, m) => sum + m.lessons.length, 0) || 0;

  const { data: completedRows } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("enrollment_id", enrollment.id)
    .eq("status", "completed");

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id")
    .eq("course_id", course.id);

  const { data: submissions } = await supabase
    .from("submissions")
    .select("assignment_id, status")
    .eq("user_id", profile.id);

  const fullyApproved =
    (assignments || []).length === 0 ||
    (assignments || []).every((a) =>
      (submissions || []).some(
        (s) => s.assignment_id === a.id && s.status === "approved",
      ),
    );

  const isComplete =
    totalLessons > 0 &&
    (completedRows?.length || 0) === totalLessons &&
    fullyApproved;

  if (!isComplete) redirect("/certificates");

const { data: certificate } = await supabase
  .from("certificates")
  .select("id, recipient_name, verification_code, issued_at, file_url")
  .eq("enrollment_id", enrollment.id)
  .maybeSingle();

  const instructorProfile = Array.isArray(course.instructor)
    ? course.instructor[0]
    : course.instructor;

  return (
    <CertificateView
      courseSlug={course.slug}
      courseTitle={course.title}
      instructorName={instructorProfile?.full_name || "Almattech Academy"}
      certificate={certificate}
    />
  );
}
