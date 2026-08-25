import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await request.formData();
  const certificateId = formData.get("certificateId") as string;
  const file = formData.get("file") as File;

  if (!certificateId || !file) {
    return NextResponse.json(
      { error: "Missing certificate ID or file" },
      { status: 400 },
    );
  }

  // ownership check — confirm this certificate actually belongs to
  // the requesting user via its enrollment, before uploading anything
  const { data: certificate } = await supabase
    .from("certificates")
    .select("id, file_url, enrollment_id, enrollments!inner ( user_id )")
    .eq("id", certificateId)
    .single();

  const enrollment = Array.isArray(certificate?.enrollments)
    ? certificate.enrollments[0]
    : certificate?.enrollments;

  if (!certificate || enrollment?.user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // already uploaded once — return the existing URL, don't re-upload
  if (certificate.file_url) {
    return NextResponse.json({ fileUrl: certificate.file_url });
  }

  const adminSupabase = createAdminSupabase();
  const path = `${certificateId}.png`;

  const { error: uploadError } = await adminSupabase.storage
    .from("certificates")
    .upload(path, file, { contentType: "image/png", upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = adminSupabase.storage
    .from("certificates")
    .getPublicUrl(path);

  await adminSupabase
    .from("certificates")
    .update({ file_url: publicUrlData.publicUrl })
    .eq("id", certificateId);

  return NextResponse.json({ fileUrl: publicUrlData.publicUrl });
}
