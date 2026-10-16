"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  History,
  Lock,
  Check,
  X,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SecurityProfile {
  username: string;
  email: string;
  role: string;
  fullName?: string;
  passwordChangedAt?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  event_id: string;
  status: string;
  error_message: string;
  created_at: string;
}

export default function AdminSecurityPage() {
  const [profile, setProfile] = useState<SecurityProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Operation state
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      const res = await fetch("/api/admin/security");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data.user);
          setAuditLogs(data.auditLogs || []);
        }
      }
    } catch (err) {
      console.error("Failed to load security profile", err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Password validation checklist
  const hasMinLength = newPassword.length >= 8;
  const hasLetters = /[A-Za-z]/.test(newPassword);
  const hasNumbers = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword.length > 0 && newPassword !== currentPassword;
  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasLetters &&
    hasNumbers &&
    passwordsMatch &&
    isDifferentFromCurrent;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Refresh audit logs & security timestamp
        fetchSecurityData();
      } else {
        setErrorMsg(data.error || "Failed to update password.");
      }
    } catch {
      setErrorMsg("Network error occurred while updating password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Security &amp; Credentials
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Account Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your administrative access credentials, session lifecycle, and review security audit records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            &larr; Back to Events Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Profile & Security Status */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Administrator Profile</h2>
                <p className="text-[11px] text-slate-500">Authenticated System Principal</p>
              </div>
            </div>

            {initialLoading ? (
              <div className="py-6 flex items-center justify-center text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading profile...
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Username</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {profile?.username || "admin"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Designated Email</span>
                  <span className="font-semibold text-slate-800">
                    {profile?.email || "acmiare@gmail.com"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Security Role</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                    {profile?.role || "super_admin"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Last Password Change</span>
                  <span className="text-slate-600">
                    {profile?.passwordChangedAt
                      ? new Date(profile.passwordChangedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Default system bootstrap"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Security Tips */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-5 text-xs text-blue-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Security Best Practices
            </div>
            <ul className="list-disc pl-4 space-y-1.5 text-blue-800 text-[11px] leading-relaxed">
              <li>Changing your password immediately revokes all prior active sessions.</li>
              <li>Passwords are salted and hashed with <strong>Argon2id/bcrypt (12 rounds)</strong> in Neon PostgreSQL.</li>
              <li>Plaintext passwords are never stored, logged, or exposed in API payloads.</li>
              <li>Password recovery links are strictly single-use and expire within <strong>30 minutes</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Center / Right Column: Change Password Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Change Account Password</h2>
                <p className="text-xs text-slate-500">
                  Update the password used to access the /admin event console and /studio CMS.
                </p>
              </div>
            </div>

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900 mb-0.5">Success</p>
                  <p className="text-emerald-700 leading-relaxed">{successMsg}</p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900 mb-0.5">Update Failed</p>
                  <p className="text-red-700 leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirmation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Policy Validation Checklist */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password Requirements
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
                <div className={`flex items-center gap-1.5 text-[11px] ${isDifferentFromCurrent ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                  {isDifferentFromCurrent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                  Different from current password
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || !isFormValid}
                  className="w-full sm:w-auto font-semibold text-xs px-6 py-2.5 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Updating Password in Database...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Security Audit Records */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Security Audit Activity</h3>
              </div>
              <button
                type="button"
                onClick={fetchSecurityData}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No recent security audit events recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase">
                      <th className="py-2 font-semibold">Event</th>
                      <th className="py-2 font-semibold">Principal / Details</th>
                      <th className="py-2 font-semibold">Status</th>
                      <th className="py-2 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 font-medium text-slate-800 font-mono text-[11px]">
                          {log.action}
                        </td>
                        <td className="py-2.5 text-slate-600 max-w-xs truncate">
                          {log.error_message || log.event_id || "System"}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
