import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/is-profile-complete";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { courseId } = await request.json();
  const supabase = await createServerSupabase();
  const adminSupabase = createAdminSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, github_username, username")
    .eq("id", user.id)
    .single();

  if (!profile || !isProfileComplete(profile)) {
    return NextResponse.json({ error: "profile_incomplete" }, { status: 400 });
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, price_kobo, status")
    .eq("id", courseId)
    .single();

  if (courseError || !course || course.status !== "published") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // check for an existing enrollment first (avoid duplicate rows,
  // and let a pending_payment student resume checkout)
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
  }

  // ---- FREE COURSE: enroll instantly ----
  if (course.price_kobo === 0) {
    if (existing) {
      await supabase
        .from("enrollments")
        .update({ status: "active" })
        .eq("id", existing.id);
    } else {
      await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: courseId,
        status: "active",
      });
    }

   await supabase
      .from("profiles")
      .update({ role: "student" })
      .eq("id", user.id)
      .eq("role", "member");

    return NextResponse.json({ success: true });
  }

  // ---- PAID COURSE: create pending enrollment + Paystack session ----
  if (!existing) {
    await supabase.from("enrollments").insert({
      user_id: user.id,
      course_id: courseId,
      status: "pending_payment",
    });
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const paystackRes = await fetch(
    "https://api.paystack.co/transaction/initialize",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: authUser?.email,
        amount: course.price_kobo,
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/enroll/callback`,
        metadata: {
          user_id: user.id,
          course_id: courseId,
        },
      }),
    },
  );

  const paystackData = await paystackRes.json();

  if (!paystackData.status) {
    return NextResponse.json(
      { error: "Payment initialization failed" },
      { status: 500 },
    );
  }

  // record the payment as pending, referenced by Paystack's own ref
  const { error: paymentInsertError } = await adminSupabase
    .from("payments")
    .insert({
      user_id: user.id,
      course_id: courseId,
      amount_kobo: course.price_kobo,
      paystack_reference: paystackData.data.reference,
      status: "pending",
    });

  if (paymentInsertError) {
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 },
    );
  }

  return NextResponse.json({ paymentUrl: paystackData.data.authorization_url });
}
