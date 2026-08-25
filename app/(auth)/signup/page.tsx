"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      window.location.href = "/dashboard";
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="text-center">
        <p className="text-sm font-mono text-accent mb-1">almost there</p>
        <h1
          className="text-xl font-semibold text-foreground mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Check your email
        </h1>
        <p className="text-sm text-gray-500">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then log in.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.resend({ type: "signup", email });
          }}
          className="text-accent hover:underline text-sm mt-4 block mx-auto font-medium"
        >
          Resend email
        </button>
        <Link
          href="/login"
          className="text-accent hover:underline text-sm mt-2 inline-block"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-mono text-accent mb-1">get started</p>
      <h1
        className="text-2xl font-semibold text-foreground mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Sign up
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="full-name"
          label="Full Name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordInput
          id="password"
          label="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="At least 6 characters"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline font-medium">
          Log in
        </Link>
      </p>
    </div>
  );
}
