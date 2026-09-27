"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { studentLinks, adminLinks } from "./nav-links";
import { cn } from "@/lib/utils";

export function AppShell({
  role,
  fullName,
  children,
}: {
  role: string;
  fullName?: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isInstructorOrAdmin = role === "instructor" || role === "admin";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }


  return (
    <div className="min-h-screen flex bg-background">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border shrink-0">
        <div className="px-5 py-8">
          <Image
            src="/logo.png"
            alt="Almattech Academy"
            width={100}
            height={50}
            loading="eager"
          />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {studentLinks.map((link) => (
            <NavItem
              key={link.label}
              link={link}
              active={pathname === link.href}
            />
          ))}

          {isInstructorOrAdmin && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 pt-5 pb-1 border-t border-border">
                Instructor
              </p>
              {adminLinks.map((link) => (
                <NavItem
                  key={link.label}
                  link={link}
                  active={
                    link.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(link.href)
                  }
                />
              ))}
            </>
          )}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          {fullName && (
            <p className="text-sm text-foreground mb-2 truncate">{fullName}</p>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* ===== Mobile/Tablet Top Bar ===== */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-6 bg-background border-b border-border">
        <Image
          src="/logo.png"
          alt="Almattech Academy"
          width={100}
          height={50}
          loading="eager"
        />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2"
        >
          <HamburgerIcon />
        </button>
      </div>

      {/* ===== Mobile/Tablet Fullscreen Overlay ===== */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-6 border-b border-border">
            <Image
              src="/logo.png"
              alt="Almattech Academy"
              width={150}
              height={50}
              loading="eager"
            />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 -mr-2"
            >
              <CloseIcon />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {studentLinks.map((link) => (
              <NavItem
                key={link.label}
                link={link}
                active={pathname === link.href}
                onClick={() => setMobileOpen(false)}
                large
              />
            ))}

            {isInstructorOrAdmin && (
              <>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-3 pt-6 pb-1">
                  Instructor
                </p>
                {adminLinks.map((link) => (
                  <NavItem
                    key={link.label}
                    link={link}
                    active={
                      link.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(link.href)
                    }
                    onClick={() => setMobileOpen(false)}
                    large
                  />
                ))}
              </>
            )}
          </nav>

          <div className="px-4 py-4 border-t border-border">
            {/* {fullName && (
              <p className="text-sm text-foreground mb-2">{fullName}</p>
            )} */}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 px-4 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  link,
  active,
  onClick,
  large,
}: {
  link: { label: string; href: string; disabled?: boolean; badge?: string };
  active: boolean;
  onClick?: () => void;
  large?: boolean;
}) {
  if (link.disabled) {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-3 rounded-md text-gray-400 cursor-not-allowed",
          large ? "py-3 text-base" : "py-2 text-sm",
        )}
      >
        <span>{link.label}</span>
        {link.badge && (
          <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
            {link.badge}
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={cn(
        "block px-3 rounded-md transition-colors",
        large ? "py-3 text-base" : "py-2 text-sm",
        active
          ? "bg-accent-light text-accent font-medium"
          : "text-foreground hover:bg-accent-light",
      )}
    >
      {link.label}
    </Link>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
