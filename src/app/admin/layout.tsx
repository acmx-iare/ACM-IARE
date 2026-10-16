import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Users,
  Award,
  ExternalLink,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Admin Navigation Bar */}
      <header className="bg-[#14213d] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white p-0.5 overflow-hidden shrink-0">
                <Image
                  src="/images/acm-iare-logo.jpg"
                  alt="ACM Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight">
                  ACM IARE
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-blue-600/60 border border-blue-400/40 text-blue-100">
                  Event Admin Console
                </span>
              </div>
            </div>

            {/* Middle: Admin Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Overview
              </Link>
              <Link
                href="/admin/events"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                Events &amp; Forms
              </Link>
              <Link
                href="/admin/events/new"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create Event
              </Link>
              <Link
                href="/admin/registrations"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Registrations
              </Link>
              <Link
                href="/admin/certificates"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Certificates</span>
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span>View Public Site</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <AdminLogoutButton />
            </div>

          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        ACM Student Chapter — Institute of Aeronautical Engineering • Automated Event &amp; Form Management System
      </footer>
    </div>
  );
}
