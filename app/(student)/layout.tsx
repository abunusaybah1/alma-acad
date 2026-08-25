import { getAuthedProfile } from "@/lib/auth/get-authed-profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getAuthedProfile();

  return <>{children}</>;
}
