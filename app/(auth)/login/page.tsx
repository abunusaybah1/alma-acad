"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmed(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      if (error.message.toLowerCase().includes("confirm")) {
        setUnconfirmed(true);
      }
      return;
    }

    const redirect = searchParams.get("redirect") || "/dashboard";
    window.location.href = redirect;
  }

  async function handleResend() {
    setResending(true);
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResent(true);
  }

  return (
    <div>
      <p className="text-sm font-mono text-accent mb-1">welcome back</p>
      <h1
        className="text-2xl font-semibold text-foreground mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Log in
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordInput
            id="password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="text-right mt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {unconfirmed && (
          <div className="text-sm bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2.5 rounded-md">
            {resent ? (
              "Confirmation email resent — check your inbox."
            ) : (
              <>
                Your email isn&apos;t confirmed yet.{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="underline font-medium"
                >
                  {resending ? "Sending..." : "Resend confirmation email"}
                </button>
              </>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-accent hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
