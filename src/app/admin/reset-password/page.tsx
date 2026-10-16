"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Token validation state
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError("Missing password recovery token in link. Please request a new recovery link.");
      return;
    }

    async function checkToken() {
      try {
        const res = await fetch(`/api/admin/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
          setAccountEmail(data.email || null);
        } else {
          setTokenValid(false);
          setTokenError(data.error || "This recovery link is invalid or has expired.");
        }
      } catch {
        setTokenValid(false);
        setTokenError("Unable to verify link validity. Please check your connection.");
      } finally {
        setVerifying(false);
      }
    }

    checkToken();
  }, [token]);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasLetters = /[A-Za-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = hasMinLength && hasLetters && hasNumbers && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setSubmitError(data.error || "Failed to reset password.");
      }
    } catch {
      setSubmitError("Network error while submitting new password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
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
            Security Credential Reset
          </div>
          <h1 className="text-xl font-bold text-[#14213d]">Set New Password</h1>
          <p className="text-xs text-slate-500">
            {accountEmail ? (
              <>Resetting administrator account password for <span className="font-semibold text-slate-800">{accountEmail}</span></>
            ) : (
              "Configure a new high-security password for your administrator account."
            )}
          </p>
        </div>

        {verifying ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Verifying recovery link authenticity...</span>
          </div>
        ) : !tokenValid ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">Recovery Link Expired or Invalid</p>
                <p className="text-amber-700 leading-relaxed">{tokenError}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/admin/forgot-password"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Request a New Recovery Link
              </Link>
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Password Reset Successfully</p>
                <p className="text-emerald-700 leading-relaxed">
                  Your administrator password has been updated and all prior sessions have been revoked for your security.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => router.push("/admin/login")}
              className="w-full justify-center py-2.5 font-semibold text-sm shadow-sm"
            >
              Sign In with New Password
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password"
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Policy Checklist */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password Security Requirements
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                At least 8 characters long
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${hasLetters && hasNumbers ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {hasLetters && hasNumbers ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                Contains both letters and numbers
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] ${passwordsMatch ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                {passwordsMatch ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                Passwords match
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || !isFormValid}
              className="w-full justify-center py-2.5 font-semibold text-sm shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating Password...
                </>
              ) : (
                <>
                  Set New Password
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center p-4">
          <div className="text-center text-slate-500 text-xs flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            Loading recovery console...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
