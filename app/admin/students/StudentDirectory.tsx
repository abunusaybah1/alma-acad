"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { BiLinkExternal } from "react-icons/bi";
import { useRouter } from "next/navigation";

type Enrollment = { id: string; status: string; courseTitle: string };
type Student = {
  id: string;
  short_id: string;
  full_name: string | null;
  bio: string | null;
  github_username: string | null;
  created_at: string;
  enrollments: Enrollment[];
};

export function StudentDirectory({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");

  const filtered = students.filter((s) =>
    (s.full_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto py-14 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-mono text-accent mb-1">admin</p>
          <h1
            className="text-3xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Students
          </h1>
        </div>
        <span className="text-sm font-mono text-gray-400">
          {students.length} total
        </span>
      </div>

      <Input
        id="search-students"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name..."
      />

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.short_id} className="rounded-lg border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground flex gap-2 items-center">
                  {s.full_name || "Unnamed student"}
                  <BiLinkExternal
                    className="text-accent"
                    onClick={() => {
                      router.push(`/admin/students/${s.short_id}`);
                    }}
                  />
                </p>
                {s.bio && (
                  <p className="text-sm text-gray-500 mt-0.5">{s.bio}</p>
                )}
              </div>
              <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                Joined {new Date(s.created_at).toLocaleDateString()}
              </span>
            </div>

            {s.enrollments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                {s.enrollments.map((e) => (
                  <span
                    key={e.id}
                    className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                      e.status === "active"
                        ? "bg-accent-light text-accent border-accent/20"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                  >
                    {e.courseTitle}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500">No students found.</p>
        )}
      </div>
    </div>
  );
}
