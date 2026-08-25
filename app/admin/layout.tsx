import { getAuthedProfile } from "@/lib/auth/get-authed-profile";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthedProfile({
    requireRole: ["instructor", "admin"],
    redirectOnRoleFail: "/dashboard",
  });

  return <>{children}</>;
}
