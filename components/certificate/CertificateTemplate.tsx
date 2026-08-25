import { forwardRef } from "react";

export const CertificateTemplate = forwardRef<
  SVGSVGElement,
  {
    recipientName: string;
    courseTitle: string;
    instructorName: string;
    issuedAt: string;
    verificationCode: string;
    logoDataUrl: string;
    signatureDataUrl: string;
    checkmarkDataUrl: string;
  }
>(
  (
    {
      recipientName,
      courseTitle,
      instructorName,
      issuedAt,
      verificationCode,
      logoDataUrl,
      signatureDataUrl,
      checkmarkDataUrl,
    },
    ref,
  ) => {
    const formattedDate = new Date(issuedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <svg
        ref={ref}
        viewBox="0 0 1000 700"
        width="1000"
        height="700"
        className="border border-border rounded-lg w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1000" height="700" fill="#ffffff" />

        <path d="M0,0 L120,0 L0,120 Z" fill="#059669" opacity="0.9" />
        <path d="M1000,700 L880,700 L1000,580 Z" fill="#059669" opacity="0.9" />
        <path d="M0,0 L90,0 L0,90 Z" fill="#0e1f17" />
        <path d="M1000,700 L910,700 L1000,610 Z" fill="#0e1f17" />

        <rect
          x="16"
          y="16"
          width="968"
          height="665"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
        />
        <rect
          x="32"
          y="32"
          width="935"
          height="630"
          fill="none"
          stroke="#0e1f17"
          strokeWidth="3"
        />

        {logoDataUrl && (
          <image href={logoDataUrl} x="440" y="80" width="120" height="40" />
        )}

        <text
          x="500"
          y="195"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="35"
          fill="#0e1f17"
        >
          Certificate of Completion
        </text>

        <text
          x="500"
          y="260"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="14"
          fill="#6b7280"
        >
          This certifies that
        </text>

        <text
          x="500"
          y="322"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="40"
          fontStyle="italic"
          fontWeight="bold"
          fill="#0e1f17"
        >
          {recipientName}
        </text>

        <line
          x1="300"
          y1="350"
          x2="700"
          y2="350"
          stroke="#059669"
          strokeWidth="2"
        />

        <text
          x="500"
          y="400"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="14"
          fill="#6b7280"
        >
          has successfully completed
        </text>

        <text
          x="500"
          y="450"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="24"
          fontWeight="bold"
          fill="#059669"
        >
          {courseTitle} Programme
        </text>

        {signatureDataUrl && (
          <image
            href={signatureDataUrl}
            x="135"
            y="514"
            width="130"
            height="50"
          />
        )}

        <line
          x1="100"
          y1="550"
          x2="300"
          y2="550"
          stroke="#0e1f17"
          strokeWidth="1"
        />

        <text
          x="200"
          y="580"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="#0e1f17"
        >
          {instructorName}
        </text>
        <text
          x="200"
          y="600"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="11"
          fill="#6b7280"
        >
          Instructor
        </text>

        {checkmarkDataUrl && (
          <image
            href={checkmarkDataUrl}
            x="750"
            y="512"
            width="130"
            height="50"
          />
        )}

        <text
          x="815"
          y="577"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="14"
          fill="#6b7280"
        >
          Certified
        </text>

        <text
          x="500"
          y="610"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="12"
          fill="#6b7280"
        >
          Issued {formattedDate}
        </text>

        <text
          x="500"
          y="630"
          textAnchor="middle"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="11"
          fill="#9ca3af"
        >
          Verify at {process.env.NEXT_PUBLIC_SITE_URL}/verify/{verificationCode}
        </text>
      </svg>
    );
  },
);

CertificateTemplate.displayName = "CertificateTemplate";
