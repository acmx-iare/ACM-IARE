"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  FolderUp,
  X,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  Star,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MediaPickerModal, SelectedMediaItem } from "./MediaPickerModal";

export interface ImportedGalleryItem {
  id: string;
  title: string;
  category: "Hackathons" | "Workshops" | "Celebrations" | "Community";
  imageUrl: string;
  year: string;
  date?: string;
  caption: string;
  altText: string;
  isFeatured: boolean;
}

interface GalleryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newItems: ImportedGalleryItem[]) => void;
  existingCount: number;
}

export function GalleryImportModal({
  isOpen,
  onClose,
  onImport,
  existingCount,
}: GalleryImportModalProps) {
  const [step, setStep] = useState<"select" | "configure">("select");
  const [openLibraryPicker, setOpenLibraryPicker] = useState(false);

  // Staged Items
  const [stagedItems, setStagedItems] = useState<
    Array<{
      id: string;
      file?: File;
      previewUrl: string;
      title: string;
      caption: string;
      description: string;
      altText: string;
      category: string;
      year: string;
      isFeatured: boolean;
      status: "pending" | "uploading" | "success" | "error";
      errorMessage?: string;
      uploadedUrl?: string;
    }>
  >([]);

  // Bulk Apply Helpers
  const [bulkCategory, setBulkCategory] = useState("Hackathons");
  const [bulkYear, setBulkYear] = useState("2026");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process files selected from local system
  const handleLocalFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) =>
        f.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f.name)
    );

    if (validFiles.length === 0) return;

    const newStaged = validFiles.map((file, idx) => {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
      return {
        id: `gal_stage_${Date.now()}_${idx}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title: cleanName,
        caption: "",
        description: "",
        altText: cleanName,
        category: "Hackathons",
        year: "2026",
        isFeatured: false,
        status: "pending" as const,
      };
    });

    setStagedItems((prev) => [...prev, ...newStaged]);
    setStep("configure");
  };

  // Process items picked from Media Library
  const handleLibraryItems = (items: SelectedMediaItem[]) => {
    const newStaged = items.map((item, idx) => {
      const cleanName = item.fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]/g, " ");
      return {
        id: `gal_stage_lib_${Date.now()}_${idx}`,
        previewUrl: item.url,
        uploadedUrl: item.url,
        title: item.altText || cleanName,
        caption: "",
        description: "",
        altText: item.altText || cleanName,
        category: item.category === "gallery" ? "Hackathons" : item.category || "Hackathons",
        year: "2026",
        isFeatured: false,
        status: "success" as const,
      };
    });

    setStagedItems((prev) => [...prev, ...newStaged]);
    setStep("configure");
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFiles(e.dataTransfer.files);
    }
  };

  // Bulk Apply
  const applyBulkCategory = () => {
    setStagedItems((prev) =>
      prev.map((item) => ({ ...item, category: bulkCategory }))
    );
  };

  const applyBulkYear = () => {
    setStagedItems((prev) => prev.map((item) => ({ ...item, year: bulkYear })));
  };

  // Upload pending local files to Cloudflare R2 and apply to gallery draft
  const handleConfirmImport = async () => {
    if (stagedItems.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const completedItems: ImportedGalleryItem[] = [];

    for (let i = 0; i < stagedItems.length; i++) {
      const item = stagedItems[i];

      let finalUrl = item.uploadedUrl || item.previewUrl;

      // If needs upload to R2
      if (item.file && item.status !== "success") {
        setStagedItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: "uploading" } : it
          )
        );

        try {
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("altText", item.altText || item.title);
          formData.append("category", "gallery");

          const res = await fetch("/api/studio/media", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.success && data.media?.public_url) {
            finalUrl = data.media.public_url;
            setStagedItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? { ...it, status: "success", uploadedUrl: finalUrl }
                  : it
              )
            );
          } else {
            // One failed file does not cancel the entire batch
            setStagedItems((prev) =>
              prev.map((it, idx) =>
                idx === i
                  ? {
                      ...it,
                      status: "error",
                      errorMessage: data.error || "Upload failed",
                    }
                  : it
              )
            );
            continue;
          }
        } catch (err: any) {
          setStagedItems((prev) =>
            prev.map((it, idx) =>
              idx === i
                ? {
                    ...it,
                    status: "error",
                    errorMessage: err.message || "Network error",
                  }
                : it
            )
          );
          continue;
        }
      }

      completedItems.push({
        id: `gal-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        title: item.title,
        category: (item.category as ImportedGalleryItem["category"]) || "Hackathons",
        imageUrl: finalUrl,
        year: item.year,
        date: `${item.year}-03-15`,
        caption: item.caption,
        altText: item.altText,
        isFeatured: item.isFeatured,
      });
    }

    setIsProcessing(false);

    if (completedItems.length > 0) {
      onImport(completedItems);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Import Gallery Photographic Entries
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Target: Gallery (Current: {existingCount} items)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Bulk image import, folder selection, Cloudflare R2 upload, captions &amp; metadata
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

          {/* Stepper Indicator */}
          <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "select"
                    ? "bg-purple-600 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                1
              </span>
              <span className={step === "select" ? "font-bold text-slate-900" : ""}>
                Select or Drop Photos
              </span>

              <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-1" />

              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "configure"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-300 text-slate-700"
                }`}
              >
                2
              </span>
              <span
                className={step === "configure" ? "font-bold text-slate-900" : ""}
              >
                Review Captions &amp; Metadata ({stagedItems.length})
              </span>
            </div>

            {step === "configure" && (
              <button
                type="button"
                onClick={() => setStep("select")}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                + Add More Photos
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {step === "select" && (
              <div className="space-y-6">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                    dragActive
                      ? "border-purple-600 bg-purple-50/50"
                      : "border-slate-300 hover:border-purple-400 bg-slate-50/50"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    Upload Multiple Gallery Photos
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Select photos from your device, drag &amp; drop an entire event folder, or reuse assets from your Media Library.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleLocalFiles(e.target.files);
                      }}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Select Multiple Files
                    </Button>

                    <input
                      ref={folderInputRef}
                      type="file"
                      multiple
                      // @ts-expect-error webkitdirectory supported in major browsers
                      webkitdirectory="true"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleLocalFiles(e.target.files);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => folderInputRef.current?.click()}
                      className="text-xs gap-1.5"
                    >
                      <FolderUp className="w-3.5 h-3.5 text-blue-600" />
                      Upload Event Folder
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenLibraryPicker(true)}
                      className="text-xs gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Choose from Media Library
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Supported Formats &amp; Import Safeguards:
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>JPEG, PNG, WebP (and safely sanitized SVG).</li>
                    <li>Uploaded assets are automatically backed by Cloudflare R2 object storage.</li>
                    <li>Imported items are preserved in draft mode and do not overwrite or publish immediately.</li>
                    <li>You can customize captions, categories, and years individually or in bulk.</li>
                  </ul>
                </div>
              </div>
            )}

            {step === "configure" && (
              <div className="space-y-6">
                {/* Bulk Actions Bar */}
                <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-900">Bulk Actions:</span>
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="px-2 py-1 text-xs border border-purple-200 rounded-md bg-white text-slate-800"
                    >
                      <option value="Hackathons">Hackathons</option>
                      <option value="Workshops">Workshops</option>
                      <option value="Community">Community</option>
                      <option value="Celebrations">Celebrations</option>
                    </select>
                    <button
                      type="button"
                      onClick={applyBulkCategory}
                      className="px-2.5 py-1 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
                    >
                      Apply Category to All
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Year"
                      value={bulkYear}
                      onChange={(e) => setBulkYear(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-purple-200 rounded-md bg-white text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={applyBulkYear}
                      className="px-2.5 py-1 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700"
                    >
                      Apply Year to All
                    </button>
                  </div>
                </div>

                {/* Staged Items Grid */}
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {stagedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3.5 hover:border-slate-300 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        {item.isFeatured && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white p-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>

                      {/* Fields */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-6 gap-2 w-full">
                        {/* Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, title: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>

                        {/* Caption */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Caption
                          </label>
                          <input
                            type="text"
                            value={item.caption}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, caption: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, description: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Category
                          </label>
                          <select
                            value={item.category}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, category: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          >
                            <option value="Hackathons">Hackathons</option>
                            <option value="Workshops">Workshops</option>
                            <option value="Community">Community</option>
                            <option value="Celebrations">Celebrations</option>
                          </select>
                        </div>

                        {/* Year */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Year
                          </label>
                          <input
                            type="text"
                            value={item.year}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, year: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>

                        {/* Alt Text */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">
                            Alt Text
                          </label>
                          <input
                            type="text"
                            value={item.altText}
                            disabled={isProcessing}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedItems((prev) =>
                                prev.map((it, idx) =>
                                  idx === index ? { ...it, altText: val } : it
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          title="Toggle Featured"
                          disabled={isProcessing}
                          onClick={() => {
                            setStagedItems((prev) =>
                              prev.map((it, idx) =>
                                idx === index
                                  ? { ...it, isFeatured: !it.isFeatured }
                                  : it
                              )
                            );
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.isFeatured
                              ? "bg-amber-50 text-amber-600 border-amber-300"
                              : "text-slate-400 hover:text-amber-500 border-slate-200"
                          }`}
                        >
                          <Star className={`w-4 h-4 ${item.isFeatured ? "fill-amber-500" : ""}`} />
                        </button>

                        <button
                          type="button"
                          title="Remove item"
                          disabled={isProcessing}
                          onClick={() =>
                            setStagedItems((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {item.status === "uploading" && (
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        )}
                        {item.status === "success" && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        {item.status === "error" && (
                          <div title={item.errorMessage}>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          </div>
                        )}
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
              {step === "configure" ? (
                <span>
                  Will add <strong>{stagedItems.length}</strong> photos to gallery draft (total will be {existingCount + stagedItems.length}).
                </span>
              ) : (
                <span>Files will be reviewed before applying to draft.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Cancel
              </Button>

              {step === "configure" && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isProcessing || stagedItems.length === 0}
                  onClick={handleConfirmImport}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Uploading &amp; Importing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Apply {stagedItems.length} Photos to Gallery Draft
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Media Picker */}
      {openLibraryPicker && (
        <MediaPickerModal
          isOpen={openLibraryPicker}
          onClose={() => setOpenLibraryPicker(false)}
          multiple={true}
          targetSectionLabel="Gallery Import"
          defaultCategory="gallery"
          onSelect={(item) => handleLibraryItems([item])}
          onSelectMultiple={(items) => handleLibraryItems(items)}
        />
      )}
    </>
  );
}
