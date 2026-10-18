"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Link2,
  Upload,
  Check,
  AlertCircle,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Monitor,
  MoveUp,
  MoveDown,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavLinkItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isValid: boolean;
  securityViolation?: string;
}

interface NavigationImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportNav: (links: Array<{ label: string; href: string; isExternal?: boolean }>) => void;
  currentLinks: Array<{ label: string; href: string; isExternal?: boolean }>;
}

const RESTRICTED_ROUTES = [
  "/admin",
  "/studio",
  "/api/admin",
  "/api/studio",
  "/verify/admin",
];

export function NavigationImportModal({
  isOpen,
  onClose,
  onImportNav,
  currentLinks,
}: NavigationImportModalProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [rawText, setRawText] = useState("");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [stagedLinks, setStagedLinks] = useState<NavLinkItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Validate individual link for security & correctness
  const validateLink = (href: string, label: string): { isValid: boolean; securityViolation?: string } => {
    const cleanHref = (href || "").trim();
    if (!cleanHref || !label.trim()) {
      return { isValid: false, securityViolation: "Empty label or link URL" };
    }

    // Dangerous protocols
    if (/^(javascript|data|vbscript):/i.test(cleanHref)) {
      return { isValid: false, securityViolation: "CRITICAL: Malicious protocol blocked (javascript/data/vbscript)" };
    }

    // Restricted administrative routes
    const lower = cleanHref.toLowerCase();
    for (const restricted of RESTRICTED_ROUTES) {
      if (lower === restricted || lower.startsWith(`${restricted}/`)) {
        return {
          isValid: false,
          securityViolation: `SECURITY BLOCK: Public navigation may not expose restricted path (${restricted})`,
        };
      }
    }

    return { isValid: true };
  };

  // Parse CSV or JSON input
  const handleParseInput = () => {
    setParseError(null);
    if (!rawText.trim()) {
      setParseError("Please provide navigation link data to parse.");
      return;
    }

    const items: NavLinkItem[] = [];

    try {
      if (format === "json") {
        const parsed = JSON.parse(rawText);
        const array = Array.isArray(parsed) ? parsed : parsed.links || parsed.navItems || [];
        array.forEach((row: any) => {
          const label = row.label || row.name || row.title || "";
          const href = row.href || row.url || row.link || "";
          const isExternal = Boolean(row.isExternal || href.startsWith("http"));
          const validation = validateLink(href, label);
          items.push({
            label,
            href,
            isExternal,
            isValid: validation.isValid,
            securityViolation: validation.securityViolation,
          });
        });
      } else {
        // CSV parsing
        const result = Papa.parse(rawText, { header: true, skipEmptyLines: true });
        if (result.errors && result.errors.length > 0) {
          console.warn("CSV parse notice:", result.errors[0]);
        }
        (result.data as any[]).forEach((row) => {
          const label = row.label || row.Label || row.name || row.Name || row.Title || "";
          const href = row.href || row.Href || row.url || row.URL || row.Link || "";
          const isExternal =
            row.isExternal === "true" ||
            row.isExternal === true ||
            href.startsWith("http");
          const validation = validateLink(href, label);
          items.push({
            label,
            href,
            isExternal,
            isValid: validation.isValid,
            securityViolation: validation.securityViolation,
          });
        });
      }

      if (items.length === 0) {
        setParseError("No valid menu links could be extracted from input.");
        return;
      }

      setStagedLinks(items);
      setStep("review");
    } catch (err: any) {
      setParseError(`Parsing error: ${err.message}`);
    }
  };

  // Reordering helpers
  const moveItem = (index: number, direction: "up" | "down") => {
    const updated = [...stagedLinks];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setStagedLinks(updated);
  };

  // Apply import to draft
  const handleConfirmImport = () => {
    // Only import valid items that do not violate security rules
    const validOnes = stagedLinks
      .filter((item) => item.isValid)
      .map(({ label, href, isExternal }) => ({ label, href, isExternal }));

    onImportNav(validOnes);
    onClose();
  };

  const hasViolations = stagedLinks.some((l) => !l.isValid);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Navigation Menu Links
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Target: Site-Wide Navbar ({currentLinks.length} active)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                JSON &amp; CSV Structured Import • Link Validation • Security Route Shields
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {step === "input" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Format:</span>
                  <button
                    type="button"
                    onClick={() => setFormat("csv")}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold uppercase transition-colors ${
                      format === "csv"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat("json")}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold uppercase transition-colors ${
                      format === "json"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    JSON
                  </button>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,text/csv,application/json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.name.endsWith(".json")) setFormat("json");
                        else setFormat("csv");

                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          setRawText((evt.target?.result as string) || "");
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    Load from File
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Navigation Links Data
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={
                    format === "csv"
                      ? "label,href,isExternal\nHome,/,\nAbout,/about,\nEvents,/events,\nTeam,/team,\nGallery,/gallery,\nContact,/contact,"
                      : '[\n  { "label": "Home", "href": "/" },\n  { "label": "About", "href": "/about" },\n  { "label": "Events", "href": "/events" },\n  { "label": "Team", "href": "/team" },\n  { "label": "Gallery", "href": "/gallery" },\n  { "label": "Contact", "href": "/contact" }\n]'
                  }
                  className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none bg-slate-50/50"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Security Policy Reminder */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 flex items-start gap-2.5 text-xs text-purple-900">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Security Protection:</span>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Routes targeting <code>/admin</code>, <code>/studio</code>, or script protocols will be rejected automatically to prevent public navigation vulnerabilities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {/* Device Preview Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-700">Preview Device:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2 py-1 rounded flex items-center gap-1 font-semibold ${
                      previewDevice === "desktop"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2 py-1 rounded flex items-center gap-1 font-semibold ${
                      previewDevice === "mobile"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Mobile
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStagedLinks([
                      ...stagedLinks,
                      { label: "New Link", href: "/", isValid: true },
                    ]);
                  }}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              </div>

              {hasViolations && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Security Block Triggered:</span>
                    <p className="text-[11px] mt-0.5">
                      One or more links target restricted routes or invalid protocols. These will NOT be applied to public navigation.
                    </p>
                  </div>
                </div>
              )}

              {/* Responsive Visual Mockup */}
              <div className="p-4 bg-slate-900 rounded-xl text-white">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-2">
                  Live Header Navigation Preview ({previewDevice})
                </span>
                <div
                  className={`flex ${
                    previewDevice === "mobile"
                      ? "flex-col gap-2 max-w-xs bg-slate-800 p-3 rounded-lg"
                      : "flex-wrap items-center gap-4"
                  }`}
                >
                  {stagedLinks.map((item, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2.5 py-1 rounded font-medium ${
                        item.isValid
                          ? "bg-slate-800 text-slate-200 border border-slate-700"
                          : "bg-red-950/80 text-red-300 border border-red-800 line-through"
                      }`}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive List Editor & Reordering */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {stagedLinks.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 flex items-center gap-3 ${
                      !item.isValid ? "bg-red-50/50" : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, "up")}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === stagedLinks.length - 1}
                        onClick={() => moveItem(index, "down")}
                        className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          const validation = validateLink(item.href, val);
                          setStagedLinks((prev) =>
                            prev.map((l, idx) =>
                              idx === index
                                ? { ...l, label: val, isValid: validation.isValid, securityViolation: validation.securityViolation }
                                : l
                            )
                          );
                        }}
                        placeholder="Label"
                        className="px-2 py-1 text-xs border border-slate-300 rounded"
                      />

                      <input
                        type="text"
                        value={item.href}
                        onChange={(e) => {
                          const val = e.target.value;
                          const validation = validateLink(val, item.label);
                          setStagedLinks((prev) =>
                            prev.map((l, idx) =>
                              idx === index
                                ? { ...l, href: val, isValid: validation.isValid, securityViolation: validation.securityViolation }
                                : l
                            )
                          );
                        }}
                        placeholder="/route or https://..."
                        className="px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                      />
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!item.isValid && (
                        <div title={item.securityViolation}>
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setStagedLinks((prev) => prev.filter((_, idx) => idx !== index))
                        }
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {step === "input" && <span>Enter CSV or JSON navigation items.</span>}
            {step === "review" && (
              <span>
                {stagedLinks.filter((l) => l.isValid).length} valid link(s) ready to import.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === "review" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("input")}
                className="text-xs"
              >
                Back
              </Button>
            )}

            {step === "input" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleParseInput}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                >
                  Parse Links <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </>
            )}

            {step === "review" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={stagedLinks.filter((l) => l.isValid).length === 0}
                onClick={handleConfirmImport}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply to Navigation Draft
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
