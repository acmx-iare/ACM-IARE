"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MediaItem {
  id: string;
  storage_key: string;
  public_url: string;
  file_name: string;
  file_size: number;
  content_type: string;
  alt_text?: string;
  category?: string;
  uploaded_by?: string;
  created_at: string;
}

export default function StudioMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Upload Form State
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("general");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Copy URL state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await fetch("/api/studio/media");
      const data = await res.json();
      if (data.success) {
        setMediaList(data.media || []);
      }
    } catch {
      console.warn("Failed to load media list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetch("/api/studio/media")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success) setMediaList(data.media || []);
      })
      .catch(() => console.warn("Failed to load media list"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("altText", altText);
      formData.append("category", category);

      const res = await fetch("/api/studio/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccess("Media asset uploaded to Cloudflare R2 bucket and recorded successfully.");
        setFileToUpload(null);
        setAltText("");
        // Reset file input element if any
        const inputElem = document.getElementById("file-upload-input") as HTMLInputElement;
        if (inputElem) inputElem.value = "";
        fetchMedia();
      } else {
        setUploadError(data.error || "Failed to upload file.");
      }
    } catch {
      setUploadError("Network error occurred during file upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (storageKey: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This will permanently remove it from Cloudflare R2.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/studio/media?key=${encodeURIComponent(storageKey)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMediaList((prev) => prev.filter((m) => m.storage_key !== storageKey));
      } else {
        alert(data.error || "Failed to delete file.");
      }
    } catch {
      alert("Network error while deleting media.");
    }
  };

  const handleCopyLink = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const filteredMedia = mediaList.filter((item) => {
    const matchesSearch =
      item.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.alt_text && item.alt_text.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
            Cloudflare R2 Bucket: acm-iare-files
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Media Asset Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Securely upload, preview, and organize chapter logos, event banners, speaker portraits, and documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/studio"
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            &larr; Back to CMS Pages
          </Link>
        </div>
      </div>

      {/* Upload Box */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-600" />
          Upload New Asset
        </h2>

        {uploadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select File</label>
              <input
                id="file-upload-input"
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
                onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              <span className="text-[10px] text-slate-400 block mt-1">JPEG, PNG, WebP, SVG, PDF (Max 10 MB)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alt Text (Accessibility)</label>
              <input
                type="text"
                placeholder="Brief visual description"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="general">General Website</option>
                <option value="team">Team Portrait</option>
                <option value="gallery">Gallery Photography</option>
                <option value="logos">Branding &amp; Logos</option>
                <option value="documents">Reports &amp; PDF</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={uploading || !fileToUpload}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Uploading to R2...
                </>
              ) : (
                "Upload Asset"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Asset Explorer & Filters */}
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Stored Assets ({filteredMedia.length})</h2>
            <button
              type="button"
              onClick={fetchMedia}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                placeholder="Search file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-slate-300 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-700 sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="team">Team</option>
              <option value="gallery">Gallery</option>
              <option value="logos">Logos</option>
              <option value="documents">Documents</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            Loading media catalog...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No media files match your query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item) => {
              const isImage = item.content_type.startsWith("image/");
              const isCopied = copiedKey === item.storage_key;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between group hover:shadow-sm transition-shadow"
                >
                  <div className="h-36 bg-slate-200 relative flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <img
                        src={item.public_url}
                        alt={item.alt_text || item.file_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback icon on broken image preview
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <FileText className="w-8 h-8 text-purple-600" />
                        <span className="text-[10px] font-mono">PDF Document</span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/90 text-slate-700 shadow-xs">
                      {item.category || "asset"}
                    </span>
                  </div>

                  <div className="p-3 space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 truncate" title={item.file_name}>
                        {item.file_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(item.file_size / 1024).toFixed(1)} KB • {item.content_type}
                      </p>
                    </div>

                    {item.alt_text && (
                      <p className="text-[11px] text-slate-500 truncate" title={item.alt_text}>
                        alt: &ldquo;{item.alt_text}&rdquo;
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(item.public_url, item.storage_key)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 hover:text-purple-900 p-1 rounded"
                        title="Copy public URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied!" : "Copy Link"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.storage_key, item.file_name)}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                        title="Delete from R2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
