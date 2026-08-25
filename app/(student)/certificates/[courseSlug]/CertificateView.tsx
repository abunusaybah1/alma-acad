"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { CertificateTemplate } from "@/components/certificate/CertificateTemplate";
import { urlToDataUrl } from "@/lib/certificate/to-data-url";

type Certificate = {
  id: string;
  recipient_name: string;
  verification_code: string;
  issued_at: string;
  file_url: string | null;
} | null;

export function CertificateView({
  courseSlug,
  courseTitle,
  instructorName,
  certificate: initialCertificate,
}: {
  courseSlug: string;
  courseTitle: string;
  instructorName: string;
  certificate: Certificate;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [certificate, setCertificate] = useState(initialCertificate);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<{
    logo: string;
    signature: string;
    checkmark: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      urlToDataUrl("/logo.png"),
      urlToDataUrl("/signature.png"),
      urlToDataUrl("/checkmark.png"),
    ]).then(([logo, signature, checkmark]) => {
      setAssets({ logo, signature, checkmark });
    });
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    const res = await fetch("/api/certificates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setCertificate(data.certificate);
  }

  function downloadPNG() {
    if (!svgRef.current || !certificate) return;

    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = 1000 * scale;
      canvas.height = 700 * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, 1000, 700);
      URL.revokeObjectURL(url);

      // always trigger the local download for the user
      const link = document.createElement("a");
      link.download = `${courseTitle.replace(/\s+/g, "-").toLowerCase()}-certificate.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      // separately, upload once so we have a permanent server-side
      // record — only fires if this certificate hasn't been uploaded yet
      if (!certificate.file_url) {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const formData = new FormData();
          formData.append("certificateId", certificate.id);
          formData.append("file", blob, "certificate.png");

          fetch("/api/certificates/upload", {
            method: "POST",
            body: formData,
          }).catch((err) => {
            console.error("Certificate upload failed:", err);
          });
        }, "image/png");
      }
    };
    img.src = url;
  }

  if (!certificate) {
    return (
      <div className="max-w-md mx-auto py-14 px-6 text-center">
        <p className="text-sm font-mono text-accent mb-1">course complete</p>
        <h1
          className="text-2xl font-semibold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {courseTitle}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          You&apos;ve finished this course — generate your certificate below.
        </p>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating..." : "Generate Certificate"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {courseTitle}
        </h1>
        <Button onClick={downloadPNG}>Download PNG</Button>
      </div>

      <div className="overflow-x-auto">
        {assets && (
          <CertificateTemplate
            ref={svgRef}
            recipientName={certificate.recipient_name}
            courseTitle={courseTitle}
            instructorName={instructorName}
            issuedAt={certificate.issued_at}
            verificationCode={certificate.verification_code}
            logoDataUrl={assets.logo}
            signatureDataUrl={assets.signature}
            checkmarkDataUrl={assets.checkmark}
          />
        )}
        {!assets && (
          <p className="text-sm text-gray-500">Loading certificate...</p>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        Verify this certificate anytime at{" "}
        <span className="font-mono text-accent">
          {process.env.NEXT_PUBLIC_SITE_URL}/verify/
          {certificate.verification_code}
        </span>
      </p>
    </div>
  );
}
