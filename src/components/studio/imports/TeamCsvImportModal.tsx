"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import {
  Users,
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TeamMember, TeamCategory } from "@/types";

interface TeamCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (updatedMembers: TeamMember[]) => void;
  existingMembers: TeamMember[];
}

interface ColumnMapping {
  name: string;
  role: string;
  category: string;
  department: string;
  bio: string;
  linkedin: string;
  github: string;
  email: string;
  imageUrl: string;
}

export function TeamCsvImportModal({
  isOpen,
  onClose,
  onImport,
  existingMembers = [],
}: TeamCsvImportModalProps) {
  const [step, setStep] = useState<"upload" | "map" | "photos" | "preview">("upload");
  const [csvRawData, setCsvRawData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");

  // Column Mappings
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: "",
    role: "",
    category: "",
    department: "",
    bio: "",
    linkedin: "",
    github: "",
    email: "",
    imageUrl: "",
  });

  // Photo batch staging
  const [batchPhotos, setBatchPhotos] = useState<
    Array<{ file: File; name: string; previewUrl: string; uploadedUrl?: string }>
  >([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  // Duplicate Resolution Strategy
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update" | "add_all">("update");

  // Error / Warning
  const [parseError, setParseError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-guess column mapping
  const autoDetectColumns = (headers: string[]) => {
    const lower = headers.map((h) => h.toLowerCase().trim());
    const findMatch = (candidates: string[]) => {
      const idx = lower.findIndex((h) => candidates.some((c) => h.includes(c)));
      return idx !== -1 ? headers[idx] : "";
    };

    return {
      name: findMatch(["full name", "name", "member name", "student name"]),
      role: findMatch(["role", "designation", "position", "title"]),
      category: findMatch(["category", "council", "tier", "division"]),
      department: findMatch(["department", "dept", "branch"]),
      bio: findMatch(["bio", "biography", "about", "description"]),
      linkedin: findMatch(["linkedin"]),
      github: findMatch(["github"]),
      email: findMatch(["email", "mail"]),
      imageUrl: findMatch(["photo", "image", "avatar", "picture"]),
    };
  };

  // Handle CSV file selection
  const handleCsvFile = (file: File) => {
    setParseError(null);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setParseError(`CSV Parse Warning: ${results.errors[0].message}`);
        }

        const data = results.data as any[];
        if (!data || data.length === 0) {
          setParseError("The uploaded CSV file contains no data rows.");
          return;
        }

        const headers = results.meta.fields || Object.keys(data[0] || {});
        setCsvHeaders(headers);
        setCsvRawData(data);
        setMapping(autoDetectColumns(headers));
        setStep("map");
      },
      error: (err) => {
        setParseError(`Failed to parse CSV: ${err.message}`);
      },
    });
  };

  // Handle Batch Photos Selection
  const handleBatchPhotos = (files: FileList | File[]) => {
    const photoList = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        file: f,
        name: f.name.toLowerCase().replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        previewUrl: URL.createObjectURL(f),
      }));

    setBatchPhotos((prev) => [...prev, ...photoList]);
  };

  // Upload Batch Photos to Cloudflare R2
  const uploadPhotosToR2 = async () => {
    if (batchPhotos.length === 0 || isUploadingPhotos) return;
    setIsUploadingPhotos(true);

    const updated = [...batchPhotos];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].uploadedUrl) continue;
      try {
        const formData = new FormData();
        formData.append("file", updated[i].file);
        formData.append("altText", updated[i].name);
        formData.append("category", "team");

        const res = await fetch("/api/studio/media", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.media?.public_url) {
          updated[i].uploadedUrl = data.media.public_url;
        }
      } catch (err) {
        console.warn("Error uploading photo to R2:", err);
      }
    }

    setBatchPhotos(updated);
    setIsUploadingPhotos(false);
  };

  // Find matched photo for a member name
  const findMatchedPhoto = (memberName: string, directUrl?: string) => {
    if (directUrl && directUrl.trim().length > 0) return directUrl;
    if (!memberName) return null;

    const clean = memberName.toLowerCase().trim();
    const match = batchPhotos.find((p) => {
      return (
        clean.includes(p.name) ||
        p.name.includes(clean) ||
        clean.replace(/\s+/g, "") === p.name.replace(/\s+/g, "")
      );
    });

    return match?.uploadedUrl || match?.previewUrl || null;
  };

  // Normalize Category string
  const normalizeCategory = (cat?: string): TeamCategory => {
    if (!cat) return "Office Bearers";
    const lower = cat.toLowerCase();
    if (lower.includes("faculty") || lower.includes("advisor")) return "Faculty";
    if (lower.includes("tech") || lower.includes("lead")) return "Technical Leads";
    if (lower.includes("committee") || lower.includes("coordinator")) return "Committee Leads";
    return "Office Bearers";
  };

  // Generate Parsed Members with Duplicate Detection
  const parsedRecords = csvRawData.map((row, idx) => {
    const name = (mapping.name ? row[mapping.name] : "") || `Member ${idx + 1}`;
    const role = (mapping.role ? row[mapping.role] : "") || "Officer";
    const category = normalizeCategory(mapping.category ? row[mapping.category] : "");
    const department = (mapping.department ? row[mapping.department] : "") || "Computer Science and Engineering";
    const bio = (mapping.bio ? row[mapping.bio] : "") || "";
    const email = mapping.email ? row[mapping.email] : "";
    const linkedin = mapping.linkedin ? row[mapping.linkedin] : "";
    const github = mapping.github ? row[mapping.github] : "";
    const directImage = mapping.imageUrl ? row[mapping.imageUrl] : "";
    const photo = findMatchedPhoto(name, directImage) || "/images/team/placeholder.jpg";

    // Duplicate check against existing members
    const existingMatch = existingMembers.find((m) => {
      const nameMatch = m.name?.toLowerCase().trim() === name?.toLowerCase().trim();
      const emailMatch = email && m.email && m.email.toLowerCase().trim() === email.toLowerCase().trim();
      return nameMatch || emailMatch;
    });

    return {
      id: existingMatch ? existingMatch.id : `team-${Date.now()}-${idx}`,
      name,
      role,
      category,
      department,
      bio,
      imageUrl: photo,
      email: email || undefined,
      linkedin: linkedin || undefined,
      github: github || undefined,
      isDuplicate: Boolean(existingMatch),
      existingMatch,
    };
  });

  // Final confirmation & Apply
  const handleApplyImport = async () => {
    // If photos are pending upload, make sure they get uploaded first
    if (batchPhotos.some((p) => !p.uploadedUrl)) {
      await uploadPhotosToR2();
    }

    let finalMembers = [...existingMembers];

    parsedRecords.forEach((item) => {
      const { isDuplicate, existingMatch, ...cleanMember } = item;

      if (isDuplicate && existingMatch) {
        if (duplicateStrategy === "update") {
          // Merge & update existing
          finalMembers = finalMembers.map((m) =>
            m.id === existingMatch.id ? { ...m, ...cleanMember } : m
          );
        } else if (duplicateStrategy === "add_all") {
          // Add as separate copy
          finalMembers.push({ ...cleanMember, id: `team-${Date.now()}-${Math.random()}` });
        }
        // If "skip", do nothing
      } else {
        // Brand new record
        finalMembers.push(cleanMember);
      }
    });

    onImport(finalMembers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Team &amp; Leadership Roster
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Target: Chapter Team ({existingMembers.length} active)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                CSV Data Import • Column Mapping • Batch Photo Matching • Duplicate Safeguards
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

        {/* Stepper Header */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "upload" ? "bg-purple-600 text-white" : "bg-emerald-600 text-white"
              }`}
            >
              1
            </span>
            <span className={step === "upload" ? "font-bold text-slate-900" : ""}>
              Upload CSV
            </span>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "map"
                  ? "bg-purple-600 text-white"
                  : step === "photos" || step === "preview"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              2
            </span>
            <span className={step === "map" ? "font-bold text-slate-900" : ""}>
              Map Columns
            </span>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "photos"
                  ? "bg-purple-600 text-white"
                  : step === "preview"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              3
            </span>
            <span className={step === "photos" ? "font-bold text-slate-900" : ""}>
              Match Photos ({batchPhotos.length})
            </span>

            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === "preview" ? "bg-purple-600 text-white" : "bg-slate-300 text-slate-700"
              }`}
            >
              4
            </span>
            <span className={step === "preview" ? "font-bold text-slate-900" : ""}>
              Preview &amp; Confirm
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STEP 1: CSV UPLOAD */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center bg-slate-50/50 hover:border-purple-400 transition-colors">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Select Team Roster CSV File
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Export your Google Sheets or Excel roster as a .CSV file and upload it here. Column names will be auto-detected.
                </p>

                <div className="mt-6 flex justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleCsvFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Browse CSV File
                  </Button>
                </div>
              </div>

              {parseError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Error Processing CSV:</span>
                    <p className="mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-800 block">Recommended CSV Columns:</span>
                <p>
                  <code>Full Name</code>, <code>Role / Designation</code>, <code>Category (Faculty / Office Bearers / Technical Leads / Committee Leads)</code>, <code>Department</code>, <code>Biography</code>, <code>LinkedIn</code>, <code>GitHub</code>, <code>Email</code>.
                </p>
                <p className="text-[11px] text-slate-500">
                  Missing columns will be safely defaulted without failing the import.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === "map" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Match CSV Columns to Team Fields
                  </h4>
                  <p className="text-xs text-slate-500">
                    Loaded {csvRawData.length} records from &quot;{fileName}&quot;. Review or adjust field mappings below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapping(autoDetectColumns(csvHeaders))}
                  className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Auto-Detect Again
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => setMapping({ ...mapping, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Role / Designation */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Designation / Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={mapping.role}
                    onChange={(e) => setMapping({ ...mapping, role: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Category / Council Tier
                  </label>
                  <select
                    value={mapping.category}
                    onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column (or default to Office Bearers) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Academic Department
                  </label>
                  <select
                    value={mapping.department}
                    onChange={(e) => setMapping({ ...mapping, department: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Biography */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Biography / About
                  </label>
                  <select
                    value={mapping.bio}
                    onChange={(e) => setMapping({ ...mapping, bio: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email Address
                  </label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LinkedIn */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    LinkedIn Profile Link
                  </label>
                  <select
                    value={mapping.linkedin}
                    onChange={(e) => setMapping({ ...mapping, linkedin: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GitHub */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    GitHub Handle / URL
                  </label>
                  <select
                    value={mapping.github}
                    onChange={(e) => setMapping({ ...mapping, github: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="">-- Select Column (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MATCH PHOTOS */}
          {step === "photos" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Batch Match Member Photos
                  </h4>
                  <p className="text-xs text-slate-500">
                    Upload photos named after members (e.g. <code>john_doe.jpg</code> or <code>srikar.png</code>) to automatically pair them.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={photoInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleBatchPhotos(e.target.files);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-xs gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-600" />
                    Select Member Photos
                  </Button>
                </div>
              </div>

              {/* Photo matches list */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {parsedRecords.map((item, idx) => {
                  const hasPhoto = item.imageUrl && item.imageUrl !== "/images/team/placeholder.jpg";
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.role} • {item.category}
                          </p>
                        </div>
                      </div>

                      <div>
                        {hasPhoto ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Matched Photo
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Using default placeholder
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {batchPhotos.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between text-xs text-purple-900">
                  <span>
                    {batchPhotos.length} photos loaded for automatic matching.
                  </span>
                  <button
                    type="button"
                    onClick={uploadPhotosToR2}
                    disabled={isUploadingPhotos}
                    className="font-bold underline flex items-center gap-1"
                  >
                    {isUploadingPhotos ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading to R2...
                      </>
                    ) : (
                      "Index All to Cloudflare R2"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PREVIEW & DUPLICATE SAFEGUARDS */}
          {step === "preview" && (
            <div className="space-y-6">
              {/* Duplicate Strategy Bar */}
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900">
                    Duplicate Records Handling:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === "update"}
                      onChange={() => setDuplicateStrategy("update")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Update existing records
                    </span>
                    <span className="text-slate-500">(Recommended)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === "skip"}
                      onChange={() => setDuplicateStrategy("skip")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Skip duplicates
                    </span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === "add_all"}
                      onChange={() => setDuplicateStrategy("add_all")}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-semibold text-slate-800">
                      Add all as new records
                    </span>
                  </label>
                </div>
              </div>

              {/* Records Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3 font-semibold">Member</th>
                        <th className="p-3 font-semibold">Role</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Department</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRecords.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="p-3 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.imageUrl}
                                alt={m.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-bold text-slate-900">{m.name}</span>
                          </td>
                          <td className="p-3 text-slate-700">{m.role}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {m.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] truncate max-w-xs">
                            {m.department}
                          </td>
                          <td className="p-3">
                            {m.isDuplicate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Duplicate (Existing)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                New Member
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {step === "upload" && <span>Upload a CSV file to begin.</span>}
            {step === "map" && <span>Ensure required fields (Name, Role) are mapped.</span>}
            {step === "photos" && <span>Batch match or continue with defaults.</span>}
            {step === "preview" && (
              <span>
                {parsedRecords.filter((r) => r.isDuplicate).length} duplicates detected out of{" "}
                {parsedRecords.length} records.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step !== "upload" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (step === "map") setStep("upload");
                  if (step === "photos") setStep("map");
                  if (step === "preview") setStep("photos");
                }}
                className="text-xs"
              >
                Back
              </Button>
            )}

            {step === "upload" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>
            )}

            {step === "map" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!mapping.name || !mapping.role}
                onClick={() => setStep("photos")}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                Next: Match Photos <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {step === "photos" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep("preview")}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                Next: Preview Changes <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {step === "preview" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyImport}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply to Team Draft
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
