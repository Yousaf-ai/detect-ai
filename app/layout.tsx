import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/site-chrome";
import "./globals.css";
import "./glass.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Detect AI — on-device authenticity check",
  description:
    "Drop an image or a one-minute video. A multi-engine forensic ensemble runs in your browser. Nothing is uploaded.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
