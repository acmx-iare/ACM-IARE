import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#14213d",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://acm.iare.ac.in"),
  title: {
    default: "ACM Student Chapter | Institute of Aeronautical Engineering (IARE)",
    template: "%s | ACM IARE Student Chapter",
  },
  description:
    "Official website of the ACM Student Chapter at Institute of Aeronautical Engineering (IARE), Hyderabad. Technical workshops, competitive programming, hackathons, and research mentorship.",
  keywords: [
    "ACM IARE",
    "ACM Student Chapter",
    "Institute of Aeronautical Engineering",
    "IARE Hyderabad",
    "Computer Science",
    "Coding Contests",
    "Technical Workshops",
    "ICPC",
  ],
  authors: [{ name: "ACM IARE Student Chapter" }],
  creator: "ACM IARE Student Chapter",
  publisher: "Institute of Aeronautical Engineering",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/images/acm-iare-logo.jpg" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://acm.iare.ac.in",
    siteName: "ACM IARE Student Chapter",
    title: "ACM Student Chapter | Institute of Aeronautical Engineering (IARE)",
    description:
      "Advancing Computing as a Science & Profession at Institute of Aeronautical Engineering, Hyderabad.",
    images: [
      {
        url: "/images/acm-iare-logo.jpg",
        width: 400,
        height: 400,
        alt: "ACM IARE Student Chapter Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#14213d] font-sans selection:bg-blue-100 selection:text-blue-900">
        <Suspense fallback={<div className="h-16 bg-white border-b border-slate-100" />}>
          <Navbar />
        </Suspense>
        <main id="main-content" className="flex-1 focus:outline-none">
          {children}
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
