import { createAdminSupabase } from "@/lib/supabase/admin";
import { CertificateTemplate } from "@/components/certificate/CertificateTemplate";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = createAdminSupabase();

  const { data: certificate } = await supabase
    .from("certificates")
    .select(
      `recipient_name, issued_at, verification_code, enrollments ( courses ( title, instructor:profiles!instructor_id ( full_name ) ) )`,
    )
    .eq("verification_code", code)
    .maybeSingle();

  if (!certificate) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center">
        <p className="text-sm font-mono text-red-600 mb-2">not found</p>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Certificate not found
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          This verification code doesn&apos;t match any issued certificate.
        </p>
      </div>
    );
  }

  const enrollment = Array.isArray(certificate.enrollments)
    ? certificate.enrollments[0]
    : certificate.enrollments;
  const course = Array.isArray(enrollment?.courses)
    ? enrollment.courses[0]
    : enrollment?.courses;
  const instructor = Array.isArray(course?.instructor)
    ? course.instructor[0]
    : course?.instructor;

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm font-mono text-accent mb-3 px-3 py-1 rounded-full border border-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          verified certificate
        </div>
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {certificate.recipient_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          completed <strong>{course?.title}</strong> on{" "}
          {new Date(certificate.issued_at).toLocaleDateString()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <CertificateTemplate
          recipientName={certificate.recipient_name}
          courseTitle={course?.title || ""}
          instructorName={instructor?.full_name || "Almattech Academy"}
          issuedAt={certificate.issued_at}
          verificationCode={certificate.verification_code}
          logoDataUrl="/logo.png"
          signatureDataUrl="/signature.png"
          checkmarkDataUrl="/checkmark.png"
        />
      </div>

      <div className="rounded-lg border border-border p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-gray-400">verification code</p>
          <p className="text-sm font-mono text-foreground">
            {certificate.verification_code}
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-accent-light text-accent border border-accent/20">
          ✓ Authentic
        </span>
      </div>
    </div>
  );
}
