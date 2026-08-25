"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_username: string | null;
  username: string | null;
  discord_username: string | null;
  role: string;
};

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [githubUsername, setGithubUsername] = useState(
    profile.github_username || "",
  );
  const [username, setUsername] = useState(profile.username || "");
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "taken" | "available"
  >("idle");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const next = searchParams.get("next");
  const [wasIncompleteOnArrival] = useState(
    !(
      profile.full_name?.trim() &&
      profile.bio?.trim() &&
      profile.github_username?.trim() &&
      profile.username?.trim()
    ),
  );

  const [nameLocked, setNameLocked] = useState(
    Boolean(profile.full_name?.trim()),
  );

  async function checkUsername(value: string) {
    const clean = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    if (!clean) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");

    const { data: taken } = await supabase.rpc("is_username_taken", {
      check_username: clean,
      exclude_id: profile.id,
    });
    setUsernameStatus(taken ? "taken" : "available");
  }

 async function handleSave() {
   if (usernameStatus === "taken") return;
   setSaving(true);

   const { error } = await supabase
     .from("profiles")
     .update({
       full_name: fullName || null,
       bio: bio || null,
       github_username: githubUsername.replace("@", "").trim() || null,
       username: username || null,
       name_locked: nameLocked || Boolean(fullName.trim()),
     })
     .eq("id", profile.id);

   setSaving(false);

   if (!error) {
     if (!nameLocked && fullName.trim()) {
       setNameLocked(true);
     }
     setSaved(true);
     if (next) {
       router.push(next);
       return;
     }
     setTimeout(() => setSaved(false), 2000);
   }
 }

  async function handleChangePassword() {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordChanged(true);
    setNewPassword("");
    setTimeout(() => setPasswordChanged(false), 2000);
  }

  return (
    <div className="max-w-xl mx-auto py-14 px-6">
      <p className="text-sm font-mono text-accent mb-1">account</p>
      <h1
        className="text-3xl font-semibold text-foreground mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Profile
      </h1>

      {next && wasIncompleteOnArrival && (
        <div className="mb-6 px-4 py-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-700">
          Please complete your profile and save to continue enrolling.
        </div>
      )}

      <div
        className="rounded-lg border border-border p-6"
        style={{
          boxShadow: wasIncompleteOnArrival
            ? "4px 4px 0 var(--color-accent-light)"
            : "none",
        }}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Email
            </label>
            <p className="text-sm text-gray-500 px-3 py-2 bg-mist rounded-md font-mono">
              {email}
            </p>
          </div>

          <Input
            id="full-name"
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={nameLocked}
            hint={
              nameLocked
                ? "This name is locked and used on your certificates."
                : "This will appear on your certificates once set — you can only set it once, so make sure it's correct."
            }
          />

          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => checkUsername(e.target.value)}
            placeholder="yourusername"
            hint={
              usernameStatus === "checking"
                ? "Checking..."
                : usernameStatus === "available"
                  ? "Available"
                  : usernameStatus === "taken"
                    ? undefined
                    : "Lowercase letters, numbers, underscores only"
            }
            error={
              usernameStatus === "taken"
                ? "That username is already taken"
                : undefined
            }
          />

          <Textarea
            id="bio"
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            hint="A couple of sentences about you — shown to mentors reviewing your work."
          />

          <Input
            id="github-username"
            label="GitHub Username"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="yourusername"
            hint={
              githubUsername
                ? `github.com/${githubUsername.replace("@", "").trim()}`
                : "Required before you can enroll in a course"
            }
          />

          <Input
            id="discord-username"
            label="Discord Username"
            value=""
            disabled
            placeholder="Coming soon"
            hint="Community features are on the way — this isn't required yet."
          />

          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={saving || usernameStatus === "taken"}
            >
              {saving ? "Saving..." : next ? "Save & Continue" : "Save Changes"}
            </Button>
            {saved && !next && (
              <span className="text-sm text-accent font-mono">Saved ✓</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-4 mt-6">
        <p className="text-sm font-mono text-accent">change password</p>
        <PasswordInput
          id="new-password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
        />
        {passwordError && (
          <p className="text-sm text-red-600">{passwordError}</p>
        )}
        <div className="flex items-center gap-3">
          <Button onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
          {passwordChanged && (
            <span className="text-sm text-accent font-mono">Updated ✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
