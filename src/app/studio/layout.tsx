import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  ExternalLink,
  Layers,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

import { redirect } from "next/navigation";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";

export const metadata = {
  title: "Website Studio CMS | ACM IARE",
  description: "Official Content Management System for ACM IARE Student Chapter public website",
};

export const instant = false;

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
          Loading studio CMS...
        </div>
      }
    >
      <StudioAuthGuard>{children}</StudioAuthGuard>
    </React.Suspense>
  );
}

async function StudioAuthGuard({ children }: { children: React.ReactNode }) {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    redirect("/admin/login?from=/studio");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Studio CMS Header */}
      <header className="bg-[#14213d] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="site-container">
          <div className="flex h-16 min-w-0 items-center justify-between gap-3">

            {/* Left: Branding */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 rounded bg-white p-0.5 overflow-hidden shrink-0">
                <Image
                  src="/images/acm-iare-logo.jpg"
                  alt="ACM Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-sm font-extrabold tracking-tight sm:text-base">
                  ACM IARE
                </span>
                <span className="hidden items-center gap-1 rounded border border-purple-400/40 bg-purple-600/70 px-2 py-0.5 text-[11px] font-bold text-purple-100 sm:flex">
                  <Layers className="h-3 w-3" />
                  Website Studio CMS
                </span>
              </div>
            </div>

            {/* Middle: Studio CMS Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link
                href="/studio"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                Pages &amp; Content
              </Link>
              <Link
                href="/studio/media"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Media Manager (R2)
              </Link>
            </nav>

            {/* Right: Switcher to Event Admin & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-blue-600/40 border border-blue-400/40 text-blue-200 hover:bg-blue-600/60 hover:text-white transition-colors"
                title="Switch to Event Admin Console"
              >
                <Calendar className="w-3 h-3" />
                <span className="hidden sm:inline">Events Admin &rarr;</span>
              </Link>

              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <AdminLogoutButton />
            </div>

          </div>
        </div>
      </header>

      {/* Main Studio Content */}
      <main className="site-container flex-1 py-5 sm:py-6 lg:py-8">
        {children}
      </main>

      {/* Studio Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        ACM IARE Website Studio CMS • Cloudflare R2 Storage &amp; Neon PostgreSQL Revision Management
      </footer>
    </div>
  );
}
