"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function EnrollButton({
  courseId,
  courseSlug,
  priceKobo,
  isLoggedIn,
  pendingPayment,
}: {
  courseId: string;
  courseSlug: string;
  priceKobo: number;
  isLoggedIn: boolean;
  pendingPayment: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    if (!isLoggedIn) {
      router.push(`/signup?redirect=/courses/${courseSlug}`);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.error === "Already enrolled") {
        // not actually a failure — just send them into the course
        router.push(`/courses/${courseSlug}`);
        return;
      }
      if (data.error === "profile_incomplete") {
        router.push(`/profile?next=/courses/${courseSlug}`);
        return;
      }
      setError(data.error || "Something went wrong.");
      return;
    }

    if (data.paymentUrl) {
      // paid course — send to Paystack checkout
      window.location.href = data.paymentUrl;
    } else {
      // free course — enrolled instantly, full reload to pick up new
      // enrollment status and load the lesson player
      window.location.reload();
    }
  }

  return (
    <div>
      <Button onClick={handleEnroll} disabled={loading}>
        {loading
          ? "Please wait..."
          : pendingPayment
            ? "Complete Payment"
            : priceKobo === 0
              ? "Enroll Free"
              : "Enroll Now"}
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
