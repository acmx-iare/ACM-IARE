"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-red-600/20 text-red-300 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
    >
      {loggingOut ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <LogOut className="w-3 h-3" />
      )}
      <span>{loggingOut ? "Logging out..." : "Logout"}</span>
    </button>
  );
}
