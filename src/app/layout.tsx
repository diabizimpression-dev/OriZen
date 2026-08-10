import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./static-tailwind.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "OriZen | GPS des droits sociaux",
  description: "Hébergement d'urgence, soins gratuits, droits sociaux · France · 24h/24",
  manifest: "/manifest.json",
  themeColor: "#020617",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 1 },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OriZen" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-[#020617] text-slate-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
