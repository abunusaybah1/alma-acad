import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { courseSlug } = await request.json();
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.full_name?.trim()) {
    return NextResponse.json({ error: "profile_incomplete" }, { status: 400 });
  }

  const { data: course } = await supabase
    .from("courses")
    .select("id, modules ( id, lessons ( id ) )")
    .eq("slug", courseSlug)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .eq("status", "active")
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  // re-verify completion server-side — never trust that the page
  // already checked this, since this endpoint could be called directly
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
    .eq("user_id", user.id);

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

  if (!isComplete) {
    return NextResponse.json({ error: "Course not complete" }, { status: 400 });
  }

  const adminSupabase = createAdminSupabase();
  const { data: certificate, error } = await adminSupabase
    .from("certificates")
    .upsert(
      { enrollment_id: enrollment.id, recipient_name: profile.full_name },
      { onConflict: "enrollment_id", ignoreDuplicates: false },
    )
    .select("id, recipient_name, verification_code, issued_at, file_url")
    .single();

  if (error) {
    console.error("Error generating certificate:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 },
    );
  }

  return NextResponse.json({ certificate });
}
