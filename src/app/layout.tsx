import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { BottomNav } from "@/components/bottom-nav";
import FacebookPixel from '@/components/facebook-pixel';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "M.E Experience",
  description: "Advanced Aesthetic Center",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Previne zoom em inputs no mobile (estilo app)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <FacebookPixel />
        {/* Adicionado pb-20 no mobile para compensar a BottomNav */}
        <div className="relative flex min-h-screen flex-col pb-20 md:pb-0">
          {children}
        </div>
        <BottomNav />
        <Toaster />
      </body>
    </html>
  );
}