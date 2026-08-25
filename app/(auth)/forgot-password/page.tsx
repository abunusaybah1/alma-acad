"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-sm font-mono text-accent mb-1">check your inbox</p>
        <h1
          className="text-xl font-semibold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Reset link sent
        </h1>
        <p className="text-sm text-gray-500">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link
          to reset your password.
        </p>
        <Link
          href="/login"
          className="text-accent hover:underline text-sm mt-4 inline-block font-medium"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-mono text-accent mb-1">trouble logging in?</p>
      <h1
        className="text-2xl font-semibold text-foreground mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Reset password
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        <Link href="/login" className="text-accent hover:underline font-medium">
          Back to login
        </Link>
      </p>
    </div>
  );
}
