import React, { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";

export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
          Loading administration console...
        </div>
      }
    >
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </Suspense>
  );
}

async function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const isAuth = await isAuthenticatedAdmin();
  const headerList = await headers();
  const pathname = headerList.get("x-admin-path") || "";

  const isAuthPage =
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/admin/forgot-password") ||
    pathname.startsWith("/admin/reset-password");

  // If user is not authenticated:
  if (!isAuth) {
    // If accessing an auth page, render strictly the clean login/auth view without any admin chrome
    if (isAuthPage) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          {children}
        </div>
      );
    }

    // For any protected admin section, immediately bounce to login on the server
    redirect(`/admin/login?from=${encodeURIComponent(pathname || "/admin")}`);
  }

  // If authenticated user visits an auth page, redirect them straight to the console
  if (isAuthPage) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Suspense fallback={null}>
        <AdminHeader />
      </Suspense>
      <main className="site-container flex-1 py-5 sm:py-6 lg:py-8">
        {children}
      </main>
      <Suspense fallback={null}>
        <AdminFooter />
      </Suspense>
    </div>
  );
}
