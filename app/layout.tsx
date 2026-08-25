import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { createServerSupabase } from "@/lib/supabase/server";
import { SiteChrome } from "@/components/nav/SiteChrome";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <SiteChrome
          isAuthenticated={!!user}
          role={profile?.role}
          fullName={profile?.full_name}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
