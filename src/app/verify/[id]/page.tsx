"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  Calendar,
  Building2,
  Hash,
  ExternalLink,
  Search,
  CheckCircle2,
} from "lucide-react";

interface VerificationResponse {
  status: "valid" | "revoked" | "not_found" | "rate_limited" | "error";
  certificate?: {
    certificateNumber: string;
    recipientName: string;
    eventTitle: string;
    eventDate?: string;
    certificateType: string;
    issuedAt: string;
    revokedAt?: string | null;
    revokedReason?: string | null;
    issuerOrganization?: string;
  };
  message?: string;
}

export default function CertificateVerificationPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      }
    >
      <CertificateVerificationContent />
    </React.Suspense>
  );
}

function CertificateVerificationContent() {
  const params = useParams();
  const router = useRouter();
  const certIdParam = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [loading, setLoading] = useState(Boolean(certIdParam));
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [searchId, setSearchId] = useState("");

  useEffect(() => {
    if (!certIdParam) return;

    let isMounted = true;

    async function fetchVerification() {
      try {
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certIdParam)}`);
        const json: VerificationResponse = await res.json();
        if (isMounted) setData(json);
      } catch {
        if (isMounted) {
          setData({
            status: "error",
            message: "Network error occurred while verifying the credential.",
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [certIdParam]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/verify/${encodeURIComponent(searchId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-white p-0.5 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/images/acm-iare-logo.jpg"
                alt="ACM IARE"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white block">
                ACM IARE
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">
                Official Credential Registry
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Visit Chapter Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Verification Card */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        {loading ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-200">Verifying Digital Credential</h2>
            <p className="text-xs text-slate-400 mt-1">
              Validating cryptographic record with ACM IARE registry...
            </p>
          </div>
        ) : !data || data.status === "not_found" ? (
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-amber-400">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3">
              Certificate Not Found
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              No Matching Credential Found
            </h1>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              The credential ID{" "}
              <code className="text-cyan-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                {certIdParam}
              </code>{" "}
              could not be found in our database. Please ensure the full certificate ID was entered accurately.
            </p>

            {/* Quick Search */}
            <form onSubmit={handleManualSearch} className="max-w-md mx-auto flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Certificate ID (e.g. ACM-IARE-2026-XXXX)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>
          </div>
        ) : data.status === "revoked" ? (
          <div className="bg-slate-900/90 border border-red-500/40 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-red-500/20">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <div className="text-center sm:text-left">
                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-red-500/20 text-red-300 border border-red-500/40 mb-2">
                  Credential Revoked
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  This Certificate Has Been Revoked
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  This certificate was invalidated by the chapter authority and is no longer considered a verified credential.
                </p>
              </div>
            </div>

            {/* Details Table */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Issued To</span>
                <span className="font-bold text-white text-sm">
                  {data.certificate?.recipientName}
                </span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Event</span>
                <span className="font-bold text-white text-sm">
                  {data.certificate?.eventTitle}
                </span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">Credential ID</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {data.certificate?.certificateNumber}
                </span>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-red-900/40 bg-red-950/20">
                <span className="text-red-400 block mb-1">Revocation Reason</span>
                <span className="font-semibold text-red-200">
                  {data.certificate?.revokedReason || "Revoked by Administrator"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Valid Certificate Card */
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top Glow Accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

            {/* Verification Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-8 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Officially Verified
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {data.certificate?.certificateType?.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Authentic Digital Credential
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Issued and certified by ACM Student Chapter, Institute of Aeronautical Engineering (IARE).
                </p>
              </div>
            </div>

            {/* Certificate Details Grid */}
            <div className="mt-8 space-y-4">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Recipient Name
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {data.certificate?.recipientName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Event / Activity
                    </span>
                    <span className="font-bold text-white text-sm block mt-0.5">
                      {data.certificate?.eventTitle}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Issuing Institution
                    </span>
                    <span className="font-semibold text-slate-200 text-xs block mt-0.5">
                      ACM IARE Student Chapter
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Institute of Aeronautical Engineering, Hyderabad
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <Hash className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Credential ID
                    </span>
                    <span className="font-mono text-cyan-300 font-bold text-xs block mt-0.5 tracking-wider">
                      {data.certificate?.certificateNumber}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Issue Date
                    </span>
                    <span className="font-medium text-slate-200 text-xs block mt-0.5">
                      {data.certificate?.issuedAt
                        ? new Date(data.certificate.issuedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Verified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Trust Indicator */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <span className="text-center sm:text-left">
                Tamper-resistant digital certificate secured on Neon PostgreSQL and Cloudflare R2.
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
                >
                  About ACM IARE
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} ACM Student Chapter, Institute of Aeronautical Engineering. All rights reserved.
      </footer>
    </div>
  );
}
