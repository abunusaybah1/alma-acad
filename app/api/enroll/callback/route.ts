import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack/verify";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(`${origin}/courses?payment=missing_reference`);
  }

  const verification = await verifyPaystackTransaction(reference);

  // console.log(
  //   "PAYSTACK VERIFY RESPONSE:",
  //   JSON.stringify(verification.data, null, 2),
  // );

  if (!verification.status || verification.data.status !== "success") {
    return NextResponse.redirect(`${origin}/courses?payment=failed`);
  }

  const { user_id: userId, course_id: courseId } =
    verification.data.metadata || {};

  if (!userId || !courseId) {
    return NextResponse.redirect(`${origin}/courses?payment=error`);
  }

  const supabase = createAdminSupabase();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("paystack_reference", reference)
    .single();

  // idempotent — the webhook may have already done this; only act if still pending
  if (payment && payment.status !== "success") {
    await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("paystack_reference", reference);
    await supabase
      .from("enrollments")
      .update({ status: "active" })
      .eq("user_id", userId)
      .eq("course_id", courseId);
    await supabase
      .from("profiles")
      .update({ role: "student" })
      .eq("id", userId)
      .eq("role", "member");
  }

  const { data: course } = await supabase
    .from("courses")
    .select("slug")
    .eq("id", courseId)
    .single();

  return NextResponse.redirect(`${origin}/courses/${course?.slug || ""}`);
}
