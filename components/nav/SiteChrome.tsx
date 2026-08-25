"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./AppShell";
import { MarketingNav } from "./MarketingNav";

const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export function SiteChrome({
  isAuthenticated,
  role,
  fullName,
  children,
}: {
  isAuthenticated: boolean;
  role?: string;
  fullName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // (auth) route group already provides its own centered logo shell —
  // don't wrap it in either nav
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isAuthenticated) {
    return (
      <AppShell role={role || "student"} fullName={fullName}>
        {children}
      </AppShell>
    );
  }

  return <MarketingNav>{children}</MarketingNav>;
}
