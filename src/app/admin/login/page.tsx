"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

function AdminLoginContent() {
  const [password, setPassword] = useState("acmiare2026admin");
  const [showPassword, setShowPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  useEffect(() => {
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(from);
        }
      })
      .catch(() => {});
  }, [router, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Invalid administrator credentials.");
      }
    } catch {
      setError("Network or server error logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center justify-center shadow-xs">
            <Image
              src="/images/acm-iare-logo.jpg"
              alt="ACM IARE Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Restricted Admin Area
          </div>
          <h1 className="text-xl font-bold text-[#14213d]">Event Management Console</h1>
          <p className="text-xs text-slate-500">
            Authenticate to manage chapter events, automated Google Forms, certificates, and website operations.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Visible Admin Credential Helper */}
        <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between gap-2 shadow-xs">
          <div>
            <span className="font-semibold text-blue-950">Admin Password: </span>
            <code className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800 font-bold select-all">
              acmiare2026admin
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              setPassword("acmiare2026admin");
              setShowPassword(true);
            }}
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline shrink-0 cursor-pointer"
          >
            Fill
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Administrator Password
              </label>
              <Link
                href="/admin/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Authorized chapter administrators and faculty coordinators only.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading}
            className="w-full justify-center py-2.5 font-semibold text-sm shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verifying Credentials...
              </>
            ) : (
              <>
                Access Console
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Need Website Studio CMS?</span>
          <Link href="/studio" className="font-semibold text-blue-600 hover:underline">
            Go to /studio &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            Loading authentication portal...
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
