"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function AdminFooter() {
  const pathname = usePathname();
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
      ACM Student Chapter — Institute of Aeronautical Engineering • Automated Event &amp; Form Management System
    </footer>
  );
}
