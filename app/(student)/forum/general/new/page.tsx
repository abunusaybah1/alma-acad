import { getAuthedProfile } from "@/lib/auth/get-authed-profile";
import Link from "next/link";
import { NewThreadForm } from "@/components/forum/NewThreadForm";

export default async function NewGeneralThreadPage() {
  await getAuthedProfile();

  return (
    <div className="max-w-2xl mx-auto py-14 px-6 space-y-6">
      <Link
        href="/forum/general"
        className="text-sm text-gray-500 hover:text-accent transition-colors"
      >
        ← General Discussion
      </Link>
      <h1
        className="text-2xl font-semibold text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        New Thread
      </h1>
      <NewThreadForm courseId={null} redirectBasePath="/forum/general" />
    </div>
  );
}
