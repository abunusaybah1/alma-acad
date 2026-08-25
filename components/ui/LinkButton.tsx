import Link from "next/link";
import { cn } from "@/lib/utils";

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variants = {
    primary: "bg-accent hover:bg-accent-hover text-white",
    secondary: "bg-accent-light text-accent hover:bg-accent hover:text-white",
    ghost: "text-gray-500 hover:text-accent",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm" };

  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}
