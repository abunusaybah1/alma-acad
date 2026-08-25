import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-mist px-4">
      <Link href="/" className="mb-8">
        <Image
          src="/logo.png"
          alt="Almattech Academy"
          width={130}
          height={36}
        />
      </Link>
      <div
        className="w-full max-w-sm bg-background border border-border rounded-lg p-7"
        style={{ boxShadow: "4px 4px 0 var(--color-accent-light)" }}
      >
        {children}
      </div>
    </div>
  );
}
