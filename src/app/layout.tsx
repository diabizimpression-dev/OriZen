import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./static-tailwind.css";
import { DiscreetProvider } from "@/components/DiscreetMode";
import Onboarding from "@/components/Onboarding";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ORIZEN | Premium Social Arsenal",
  description: "L'arsenal juridique et humanitaire pour vos droits fondamentaux.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-background text-foreground min-h-screen selection:bg-cyber-pink selection:text-white`}>
        <DiscreetProvider>
          <Onboarding />
          {children}
        </DiscreetProvider>
      </body>
    </html>
  );
}
