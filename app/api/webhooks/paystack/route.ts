import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    const { reference, metadata } = event.data;
    const userId = metadata?.user_id;
    const courseId = metadata?.course_id;

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    // idempotent — only act if this payment hasn't already been marked success
    const { data: payment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("paystack_reference", reference)
      .single();

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
  }

  return NextResponse.json({ received: true });
}
