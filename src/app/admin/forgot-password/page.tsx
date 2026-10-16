"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("acmiare@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setFeedbackMessage(data.message);
      } else {
        setError(data.error || "Failed to process password recovery request.");
      }
    } catch {
      setError("Network or server connection error. Please try again.");
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Account Security Recovery
          </div>
          <h1 className="text-xl font-bold text-[#14213d]">Forgot Administrator Password</h1>
          <p className="text-xs text-slate-500">
            Submit your verified administrator address to receive a single-use 30-minute password recovery link.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900 mb-1">Recovery Request Dispatched</p>
                <p className="text-emerald-700 leading-relaxed">{feedbackMessage}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Security Reminders
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                <li>The recovery link is valid for <strong>30 minutes</strong> only.</li>
                <li>Each link is strictly single-use and will be invalidated once consumed.</li>
                <li>If email delivery is not configured, check with the chapter technical lead or server logs.</li>
              </ul>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Admin Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designated Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="acmiare@gmail.com"
                  className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Official chapter recovery email: <span className="font-mono text-slate-600">acmiare@gmail.com</span>
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
                  Generating Recovery Link...
                </>
              ) : (
                <>
                  Send Recovery Link
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Remember your password? Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
