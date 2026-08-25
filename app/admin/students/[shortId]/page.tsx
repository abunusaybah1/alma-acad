import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });
  const { shortId } = await params;
  const supabase = await createServerSupabase();

  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, bio, github_username, role, created_at")
    .eq("short_id", shortId)
    .single();

  if (!student) notFound();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, status, enrolled_at, courses ( title, slug )")
    .eq("user_id", student.id);

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, content, status, submitted_at, assignments ( title )")
    .eq("user_id", student.id)
    .order("submitted_at", { ascending: false });

  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-8">
      <div>
        <p className="text-sm font-mono text-accent mb-1">student</p>
        <h1
          className="text-3xl font-semibold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {student.full_name || "Unnamed"}
        </h1>
        <p className="text-sm text-gray-500 font-mono mt-1">{student.email}</p>
      </div>

      <div className="rounded-lg border border-border p-6 space-y-2">
        <p className="text-sm font-mono text-accent">details</p>
        {student.bio && (
          <p className="text-sm text-foreground">{student.bio}</p>
        )}
        {student.github_username && (
          <a
            href={`https://github.com/${student.github_username}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-accent hover:underline block font-mono"
          >
            github.com/{student.github_username}
          </a>
        )}
        <p className="text-xs text-gray-400 font-mono">
          Joined {new Date(student.created_at).toLocaleDateString()}
        </p>
      </div>

      <div>
        <p className="text-sm font-mono text-accent mb-3">enrollments</p>
        <div className="space-y-2">
          {(enrollments || []).map((e) => {
            const c = Array.isArray(e.courses) ? e.courses[0] : e.courses;
            return (
              <div
                key={e.id}
                className="flex justify-between px-4 py-2.5 rounded-md border border-border text-sm"
              >
                <span>{c?.title}</span>
                <span className="font-mono text-gray-400">{e.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-mono text-accent mb-3">submissions</p>
        <div className="space-y-2">
          {(submissions || []).map((s) => {
            const a = Array.isArray(s.assignments)
              ? s.assignments[0]
              : s.assignments;
            return (
              <div
                key={s.id}
                className="px-4 py-3 rounded-md border border-border text-sm"
              >
                <div className="flex justify-between">
                  <span>{a?.title}</span>
                  <span className="font-mono text-gray-400">{s.status}</span>
                </div>
                <a
                  href={s.content || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-accent hover:underline break-all"
                >
                  {s.content}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
