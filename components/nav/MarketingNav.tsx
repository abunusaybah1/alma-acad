"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Courses", href: "/courses" },
  { label: "Contact", href: "/contact" },
];

export function MarketingNav({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Almattech Academy"
              width={140}
              height={36}
              loading="eager"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "text-accent font-medium"
                    : "text-foreground hover:text-accent transition-colors"
                }
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-foreground hover:text-accent transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md transition-colors"
            >
              Get Started
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-2 -mr-2"
          >
            <HamburgerIcon />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Image
              src="/logo.png"
              alt="Almattech Academy"
              width={120}
              height={32}
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
          <nav className="flex-1 px-4 py-6 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-3 rounded-md text-base text-foreground hover:bg-accent-light transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-3 rounded-md text-base text-foreground hover:bg-accent-light transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-3 rounded-md text-base bg-accent text-white text-center mt-2"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-gray-500 flex justify-between">
          <span>© {new Date().getFullYear()} Almattech Academy</span>
          <Link href="/contact" className="hover:text-accent transition-colors">
            Contact
          </Link>
        </div>
      </footer>
    </div>
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
