"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  Download,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Trash2,
  Upload,
} from "lucide-react";
import Papa from "papaparse";
import { IssuedCertificate, CertificateTemplate, ChapterEvent, EventRegistration } from "@/types";

export default function AdminCertificatesPage() {
  const [activeTab, setActiveTab] = useState<"registry" | "issue" | "templates">("registry");

  // Data states
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters & search for Registry tab
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Issuance Form State
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [certType, setCertType] = useState<"participation" | "winner" | "appreciation" | "speaker">("participation");
  const [issuanceSource, setIssuanceSource] = useState<"registrations" | "manual" | "csv">("registrations");
  
  // Single manual recipient
  const [manualRecipient, setManualRecipient] = useState({
    name: "",
    email: "",
    rollNumber: "",
    department: "",
  });

  // Selected registration IDs for bulk issuance
  const [selectedRegIds, setSelectedRegIds] = useState<string[]>([]);

  // CSV parsed recipients
  const [csvRecipients, setCsvRecipients] = useState<
    Array<{ name: string; email: string; rollNumber?: string; department?: string }>
  >([]);
  const [csvFileName, setCsvFileName] = useState("");

  // Progress & Execution State
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueProgress, setIssueProgress] = useState<{
    stage: string;
    total: number;
    current: number;
    results?: {
      issuedCount: number;
      skippedCount: number;
      failedCount: number;
      skipped?: Array<{ name: string; email: string; reason: string }>;
      failed?: Array<{ recipient: unknown; error: string }>;
    };
  } | null>(null);

  // Live Preview Modal
  const [previewPdfUri, setPreviewPdfUri] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Revocation Modal
  const [revokingCert, setRevokingCert] = useState<IssuedCertificate | null>(null);
  const [revocationReason, setRevocationReason] = useState("");
  const [isSubmittingRevoke, setIsSubmittingRevoke] = useState(false);

  // Load initial data
  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetch("/api/admin/certificates").then((r) => r.json()),
      fetch("/api/admin/certificates/templates").then((r) => r.json()),
      fetch("/api/admin/events").then((r) => r.json()),
      fetch("/api/admin/registrations").then((r) => r.json()),
    ])
      .then(([certData, tmplData, eventData, regData]) => {
        if (!isMounted) return;
        if (certData.success) {
          setCertificates(certData.certificates || []);
          setStats(certData.stats || { total: 0, active: 0, revoked: 0 });
        }
        if (tmplData.success && tmplData.templates) {
          setTemplates(tmplData.templates);
          setSelectedTemplateId((prev) => prev || tmplData.templates[0]?.id || "");
        }
        if (eventData.success && eventData.events) {
          setEvents(eventData.events);
          setSelectedEventId((prev) => prev || eventData.events[0]?.id || "");
        }
        if (regData.success && regData.registrations) {
          setRegistrations(regData.registrations);
        }
      })
      .catch((err) => {
        console.error("Failed to load certificates administration data:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Registrations filtered by selected event in Issuance tab
  const availableRegistrations = useMemo(() => {
    if (!selectedEventId) return registrations;
    return registrations.filter((r) => r.eventId === selectedEventId);
  }, [selectedEventId, registrations]);

  // Selected event object
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId);
  }, [selectedEventId, events]);

  // Filtered certificates for Registry table
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      if (eventFilter && c.eventId !== eventFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.recipientName.toLowerCase().includes(q) ||
          c.recipientEmail.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q) ||
          (c.recipientRollNumber && c.recipientRollNumber.toLowerCase().includes(q)) ||
          c.eventTitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [certificates, eventFilter, statusFilter, search]);

  // Handle CSV Upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed: Array<{ name: string; email: string; rollNumber?: string; department?: string }> = [];

        for (const row of rows) {
          // Normalize column names
          const name = row["Name"] || row["Full Name"] || row["fullName"] || row["Student Name"] || "";
          const email = row["Email"] || row["Email Address"] || row["email"] || "";
          const rollNumber = row["Roll Number"] || row["Roll No"] || row["rollNumber"] || row["Roll"] || "";
          const department = row["Department"] || row["Branch"] || row["department"] || "";

          if (name && email) {
            parsed.push({
              name: name.trim(),
              email: email.trim(),
              rollNumber: rollNumber ? rollNumber.trim() : undefined,
              department: department ? department.trim() : undefined,
            });
          }
        }
        setCsvRecipients(parsed);
      },
      error: (err) => {
        alert("Failed to parse CSV file: " + err.message);
      },
    });
  };

  // Trigger Live Preview
  const handleOpenPreview = async () => {
    setIsPreviewLoading(true);
    setPreviewPdfUri(null);

    const eventTitle = selectedEvent ? selectedEvent.title : "ACM Technical Conclave 2026";
    const eventDate = selectedEvent ? selectedEvent.date : "October 2026";

    // Recipient sample
    let sampleRecipient = {
      name: "K. SAI HARSHA",
      rollNumber: "23951A0501",
      department: "Computer Science & Engineering",
    };
    if (issuanceSource === "manual" && manualRecipient.name) {
      sampleRecipient = {
        name: manualRecipient.name,
        rollNumber: manualRecipient.rollNumber || "23951A0501",
        department: manualRecipient.department || "Computer Science",
      };
    } else if (issuanceSource === "csv" && csvRecipients.length > 0) {
      sampleRecipient = {
        name: csvRecipients[0].name,
        rollNumber: csvRecipients[0].rollNumber || "23951A0501",
        department: csvRecipients[0].department || "Computer Science",
      };
    }

    try {
      const res = await fetch("/api/admin/certificates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          eventTitle,
          eventDate,
          certificateType: certType,
          recipientName: sampleRecipient.name,
          recipientRollNumber: sampleRecipient.rollNumber,
          recipientDepartment: sampleRecipient.department,
        }),
      });

      const json = await res.json();
      if (json.success && json.dataUri) {
        setPreviewPdfUri(json.dataUri);
      } else {
        alert("Preview error: " + (json.error || "Failed to render preview."));
      }
    } catch {
      alert("Network error generating preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Submit Issuance
  const handleExecuteIssuance = async () => {
    const eventTitle = selectedEvent ? selectedEvent.title : "ACM Chapter Technical Event";
    const eventDate = selectedEvent ? selectedEvent.date : "";

    let recipientsToIssue: Array<{ name: string; email: string; rollNumber?: string; department?: string }> = [];

    if (issuanceSource === "manual") {
      if (!manualRecipient.name || !manualRecipient.email) {
        alert("Please enter both recipient name and email.");
        return;
      }
      recipientsToIssue = [manualRecipient];
    } else if (issuanceSource === "registrations") {
      if (selectedRegIds.length === 0) {
        alert("Please select at least one registered participant from the list.");
        return;
      }
      recipientsToIssue = availableRegistrations
        .filter((r) => selectedRegIds.includes(r.id))
        .map((r) => ({
          name: r.fullName,
          email: r.email,
          rollNumber: r.rollNumber,
          department: r.department,
        }));
    } else if (issuanceSource === "csv") {
      if (csvRecipients.length === 0) {
        alert("Please upload a CSV file containing participant records.");
        return;
      }
      recipientsToIssue = csvRecipients;
    }

    if (recipientsToIssue.length === 0) {
      alert("No recipients selected.");
      return;
    }

    setIsIssuing(true);
    setIssueProgress({
      stage: `Generating and uploading ${recipientsToIssue.length} credential(s)...`,
      total: recipientsToIssue.length,
      current: 0,
    });

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId || "general",
          eventTitle,
          eventDate,
          templateId: selectedTemplateId,
          certificateType: certType,
          recipients: recipientsToIssue,
          preventDuplicates: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIssueProgress({
          stage: "Completed",
          total: recipientsToIssue.length,
          current: json.issuedCount,
          results: {
            issuedCount: json.issuedCount,
            skippedCount: json.skippedCount,
            failedCount: json.failedCount,
            skipped: json.skipped,
            failed: json.failed,
          },
        });
        setRefreshKey((k) => k + 1);
      } else {
        alert("Issuance failed: " + (json.error || "Unknown server error"));
        setIssueProgress(null);
      }
    } catch {
      alert("Network error executing certificate issuance.");
      setIssueProgress(null);
    } finally {
      setIsIssuing(false);
    }
  };

  // Handle Download Request
  const handleDownloadCert = async (certNumber: string) => {
    try {
      const res = await fetch(`/api/admin/certificates/download?certificateNumber=${certNumber}`);
      const json = await res.json();
      if (json.success && json.downloadUrl) {
        window.open(json.downloadUrl, "_blank");
      } else {
        alert("Download error: " + (json.error || "Could not retrieve download URL."));
      }
    } catch {
      alert("Network error fetching download link.");
    }
  };

  // Handle Revoke Request
  const handleConfirmRevoke = async () => {
    if (!revokingCert) return;
    setIsSubmittingRevoke(true);

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateNumber: revokingCert.certificateNumber,
          reason: revocationReason || "Administrative invalidation",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCertificates((prev) =>
          prev.map((c) =>
            c.certificateNumber === revokingCert.certificateNumber
              ? {
                  ...c,
                  status: "revoked",
                  revokedAt: new Date().toISOString(),
                  revokedReason: revocationReason || "Administrative invalidation",
                }
              : c
          )
        );
        setStats((s) => ({ ...s, active: Math.max(0, s.active - 1), revoked: s.revoked + 1 }));
        setRevokingCert(null);
        setRevocationReason("");
      } else {
        alert("Revocation failed: " + (json.error || "Error updating certificate status"));
      }
    } catch {
      alert("Network error submitting revocation.");
    } finally {
      setIsSubmittingRevoke(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Certificate Management &amp; Issuance Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Generate tamper-evident, verifiable certificates with Cloudflare R2 storage &amp; Neon registry.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Total Issued
            </span>
            <span className="text-lg font-extrabold text-slate-800">{stats.total}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Active / Valid
            </span>
            <span className="text-lg font-extrabold text-emerald-700">{stats.active}</span>
          </div>
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider block">
              Revoked
            </span>
            <span className="text-lg font-extrabold text-red-600">{stats.revoked}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab("registry")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "registry"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Issued Registry ({certificates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("issue")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "issue"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue Certificates</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "templates"
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Templates &amp; Layouts ({templates.length})</span>
        </button>
      </div>

      {/* TAB 1: REGISTRY TABLE */}
      {activeTab === "registry" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipient, roll, credential ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Event Filter */}
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="">All Statuses</option>
                <option value="valid">Valid</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh Registry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
              Loading certificate registry from Neon...
            </div>
          ) : filteredCertificates.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No certificates match the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Credential ID</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        <Link
                          href={`/verify/${encodeURIComponent(cert.certificateNumber)}`}
                          target="_blank"
                          className="hover:text-cyan-600 hover:underline flex items-center gap-1"
                        >
                          <span>{cert.certificateNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cert.recipientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cert.recipientRollNumber ? `${cert.recipientRollNumber} • ` : ""}
                          {cert.recipientEmail}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-800 font-medium">
                        {cert.eventTitle}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {cert.certificateType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(cert.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {cert.status === "valid" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" />
                            Valid
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200"
                            title={cert.revokedReason || "Revoked"}
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Secure Download */}
                          <button
                            onClick={() => handleDownloadCert(cert.certificateNumber)}
                            className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            title="Download PDF Certificate"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Revoke Button */}
                          {cert.status === "valid" && (
                            <button
                              onClick={() => {
                                setRevokingCert(cert);
                                setRevocationReason("");
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Revoke Certificate"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ISSUE CERTIFICATES */}
      {activeTab === "issue" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-600" />
                1. Select Event &amp; Template Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Event Associated
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      setSelectedRegIds([]);
                    }}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- General / Non-event specific --</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.date})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Template Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Certificate Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Certificate Type */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Credential Category
                  </label>
                  <select
                    value={certType}
                    onChange={(e) =>
                      setCertType(
                        e.target.value as "participation" | "winner" | "appreciation" | "speaker"
                      )
                    }
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="participation">Participation</option>
                    <option value="winner">Winner / Excellence</option>
                    <option value="appreciation">Appreciation</option>
                    <option value="speaker">Speaker</option>
                  </select>
                </div>

                {/* Source Mode */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Recipient Source
                  </label>
                  <select
                    value={issuanceSource}
                    onChange={(e) =>
                      setIssuanceSource(e.target.value as "registrations" | "manual" | "csv")
                    }
                    className="w-full text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="registrations">
                      From Registrations Database ({availableRegistrations.length})
                    </option>
                    <option value="csv">Import from CSV / Excel</option>
                    <option value="manual">Manual Single Entry</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Recipient Selection Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  2. Recipient Information &amp; Validation
                </span>
                {issuanceSource === "registrations" && (
                  <span className="text-xs font-normal text-slate-500">
                    Selected: {selectedRegIds.length} of {availableRegistrations.length}
                  </span>
                )}
              </h2>

              {/* MODE A: FROM REGISTRATIONS */}
              {issuanceSource === "registrations" && (
                <div>
                  {availableRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No registrations found in database for this event. You can also import via CSV or enter manually.
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b text-xs">
                        <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              selectedRegIds.length > 0 &&
                              selectedRegIds.length === availableRegistrations.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRegIds(availableRegistrations.map((r) => r.id));
                              } else {
                                setSelectedRegIds([]);
                              }
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          Select All ({availableRegistrations.length} participants)
                        </label>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {availableRegistrations.map((reg) => {
                          const isSelected = selectedRegIds.includes(reg.id);
                          return (
                            <label
                              key={reg.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isSelected ? "bg-amber-50/60" : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedRegIds((prev) =>
                                      prev.includes(reg.id)
                                        ? prev.filter((id) => id !== reg.id)
                                        : [...prev, reg.id]
                                    );
                                  }}
                                  className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{reg.fullName}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {reg.rollNumber ? `${reg.rollNumber} • ` : ""}
                                    {reg.email}
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {reg.department || "IARE"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE B: CSV IMPORT */}
              {issuanceSource === "csv" && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-amber-400 transition-colors">
                    <FileSpreadsheet className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h3 className="text-xs font-bold text-slate-700">
                      Upload CSV file with columns: Name, Email, Roll Number, Department
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Accepts standard exports from Google Sheets, Microsoft Excel, or Google Forms.
                    </p>
                    <label className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{csvFileName || "Choose CSV File"}</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {csvRecipients.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800">
                          Parsed Recipients ({csvRecipients.length})
                        </span>
                        <button
                          onClick={() => {
                            setCsvRecipients([]);
                            setCsvFileName("");
                          }}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 text-xs font-mono">
                        {csvRecipients.map((rec, i) => (
                          <div key={i} className="py-1.5 flex justify-between">
                            <span className="font-semibold text-slate-900">{rec.name}</span>
                            <span className="text-slate-500">{rec.email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE C: MANUAL SINGLE ENTRY */}
              {issuanceSource === "manual" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={manualRecipient.name}
                      onChange={(e) =>
                        setManualRecipient({ ...manualRecipient, name: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@iare.ac.in"
                      value={manualRecipient.email}
                      onChange={(e) =>
                        setManualRecipient({ ...manualRecipient, email: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Roll Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 23951A0501"
                      value={manualRecipient.rollNumber}
                      onChange={(e) =>
                        setManualRecipient({ ...manualRecipient, rollNumber: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Department (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science & Engineering"
                      value={manualRecipient.department}
                      onChange={(e) =>
                        setManualRecipient({ ...manualRecipient, department: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action & Preview Summary */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-3">
                3. Preview &amp; Issue Action
              </h2>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Event:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[160px] truncate">
                    {selectedEvent ? selectedEvent.title : "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold uppercase text-slate-800">{certType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Destination:</span>
                  <span className="font-semibold text-cyan-700">Cloudflare R2 (Private)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registry:</span>
                  <span className="font-semibold text-slate-800">Neon PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duplicate Shield:</span>
                  <span className="font-semibold text-emerald-600">Active (Idempotent)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t space-y-2">
                <button
                  type="button"
                  onClick={handleOpenPreview}
                  disabled={isPreviewLoading}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  <span>{isPreviewLoading ? "Generating Preview..." : "Live Design Preview"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteIssuance}
                  disabled={isIssuing}
                  className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-amber-900/10 flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{isIssuing ? "Issuing Certificates..." : "Generate & Issue Certificates"}</span>
                </button>
              </div>

              {/* Results & Progress Box */}
              {issueProgress && (
                <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    {isIssuing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{issueProgress.stage}</span>
                  </div>

                  {issueProgress.results && (
                    <div className="space-y-1 text-[11px] pt-2 border-t">
                      <div className="text-emerald-700 font-semibold">
                        ✓ Successfully Issued: {issueProgress.results.issuedCount}
                      </div>
                      {issueProgress.results.skippedCount > 0 && (
                        <div className="text-amber-700 font-semibold">
                          ⚠ Skipped (Already issued): {issueProgress.results.skippedCount}
                        </div>
                      )}
                      {issueProgress.results.failedCount > 0 && (
                        <div className="text-red-700 font-semibold">
                          ✕ Failed: {issueProgress.results.failedCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES & LAYOUTS */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    {tmpl.type}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{tmpl.id}</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Certificate Title
                    </span>
                    <span className="font-bold text-slate-800">{tmpl.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Citation Text
                    </span>
                    <span className="text-slate-600 italic block">{tmpl.bodyTemplate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTemplateId(tmpl.id);
                    setActiveTab("issue");
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Use This Template</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewPdfUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="p-4 border-b flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  Live Certificate Design Preview
                </h3>
              </div>
              <button
                onClick={() => setPreviewPdfUri(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-2 bg-slate-200 flex items-center justify-center overflow-auto min-h-[480px]">
              <iframe
                src={previewPdfUri}
                className="w-full h-full min-h-[500px] rounded-lg shadow-inner border border-slate-300"
                title="Certificate PDF Preview"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t flex items-center justify-between text-xs text-slate-500">
              <span>A4 Landscape preview rendered live with pdf-lib &amp; QR verification.</span>
              <button
                onClick={() => setPreviewPdfUri(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOCATION MODAL */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                Revoke Certificate Credential
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Revoking this certificate immediately invalidates its public verification status in Neon database.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono space-y-1">
              <div>
                <span className="text-slate-400">ID: </span>
                <span className="font-bold text-slate-800">{revokingCert.certificateNumber}</span>
              </div>
              <div>
                <span className="text-slate-400">Recipient: </span>
                <span className="font-semibold text-slate-800">{revokingCert.recipientName}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Revocation *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Ineligible registration, typographical error, or administrative void..."
                value={revocationReason}
                onChange={(e) => setRevocationReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRevokingCert(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={isSubmittingRevoke}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white disabled:opacity-50"
              >
                {isSubmittingRevoke ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
