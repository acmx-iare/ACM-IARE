import React, { Suspense } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminFooter } from "@/components/admin/AdminFooter";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Suspense fallback={null}>
        <AdminHeader />
      </Suspense>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <Suspense fallback={null}>
        <AdminFooter />
      </Suspense>
    </div>
  );
}
