"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Image as ImageIcon,
  FolderUp,
  Search,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Filter,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface SelectedMediaItem {
  id?: string;
  url: string;
  fileName: string;
  altText?: string;
  category?: string;
  contentType?: string;
  size?: number;
}

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SelectedMediaItem) => void;
  onSelectMultiple?: (items: SelectedMediaItem[]) => void;
  multiple?: boolean;
  targetSectionLabel?: string;
  allowedTypes?: "images" | "all";
  defaultCategory?: string;
  category?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  multiple = false,
  targetSectionLabel = "Current Section",
  allowedTypes = "images",
  defaultCategory = "general",
  category,
}: MediaPickerModalProps) {
  const activeDefaultCategory = category || defaultCategory || "general";
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  // Library State
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItems, setSelectedItems] = useState<SelectedMediaItem[]>([]);

  // Upload State
  const [uploadFiles, setUploadFiles] = useState<
    Array<{
      file: File;
      id: string;
      previewUrl: string;
      altText: string;
      category: string;
      status: "pending" | "uploading" | "success" | "error";
      errorMessage?: string;
      uploadedUrl?: string;
    }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Fetch Media Library
  const fetchMedia = async () => {
    try {
      setLoadingMedia(true);
      const res = await fetch("/api/studio/media");
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setMediaList(data.media);
      }
    } catch (err) {
      console.warn("Failed to fetch media assets:", err);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedItems([]);
      setUploadFiles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter library items
  const filteredMedia = mediaList.filter((item) => {
    const matchesSearch =
      item.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt_text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const isImage = !allowedTypes || allowedTypes === "all" || item.content_type?.startsWith("image/");
    return matchesSearch && matchesCategory && isImage;
  });

  const categories = Array.from(
    new Set(mediaList.map((m) => m.category).filter(Boolean))
  );

  // Selection logic for Library
  const toggleItemSelection = (item: any) => {
    const itemData: SelectedMediaItem = {
      id: item.id,
      url: item.public_url,
      fileName: item.file_name,
      altText: item.alt_text || item.file_name,
      category: item.category,
      contentType: item.content_type,
      size: item.file_size,
    };

    if (multiple) {
      const exists = selectedItems.some((s) => s.url === itemData.url);
      if (exists) {
        setSelectedItems(selectedItems.filter((s) => s.url !== itemData.url));
      } else {
        setSelectedItems([...selectedItems, itemData]);
      }
    } else {
      setSelectedItems([itemData]);
    }
  };

  const handleConfirmLibrarySelection = () => {
    if (selectedItems.length === 0) return;
    if (multiple && onSelectMultiple) {
      onSelectMultiple(selectedItems);
    } else if (selectedItems.length > 0) {
      onSelect(selectedItems[0]);
    }
    onClose();
  };

  // Add files to staging
  const addFilesToStaging = (files: FileList | File[]) => {
    const newItems = Array.from(files)
      .filter((file) => {
        if (allowedTypes === "images") {
          return (
            file.type.startsWith("image/") ||
            /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(file.name)
          );
        }
        return true;
      })
      .map((file) => ({
        file,
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: URL.createObjectURL(file),
        altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        category: activeDefaultCategory,
        status: "pending" as const,
      }));

    setUploadFiles((prev) => [...prev, ...newItems]);
    setActiveTab("upload");
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToStaging(e.dataTransfer.files);
    }
  };

  // Execute Uploads to R2 via /api/studio/media
  const handleStartUpload = async () => {
    if (uploadFiles.length === 0 || isUploading) return;
    setIsUploading(true);

    const successfullyUploaded: SelectedMediaItem[] = [];

    for (let i = 0; i < uploadFiles.length; i++) {
      const item = uploadFiles[i];
      if (item.status === "success" && item.uploadedUrl) {
        successfullyUploaded.push({
          url: item.uploadedUrl,
          fileName: item.file.name,
          altText: item.altText,
          category: item.category,
        });
        continue;
      }

      // Mark uploading
      setUploadFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("altText", item.altText);
        formData.append("category", item.category);

        const res = await fetch("/api/studio/media", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.media) {
          const uploadedUrl = data.media.public_url;
          setUploadFiles((prev) =>
            prev.map((f, idx) =>
              idx === i ? { ...f, status: "success", uploadedUrl } : f
            )
          );
          successfullyUploaded.push({
            id: data.media.id,
            url: uploadedUrl,
            fileName: item.file.name,
            altText: item.altText,
            category: item.category,
          });
        } else {
          setUploadFiles((prev) =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: "error",
                    errorMessage: data.error || "Upload failed",
                  }
                : f
            )
          );
        }
      } catch (err: any) {
        setUploadFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  errorMessage: err.message || "Network error",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    // Refresh library in background
    fetchMedia();

    // If all or some succeeded, allow inserting immediately
    if (successfullyUploaded.length > 0) {
      if (multiple && onSelectMultiple) {
        onSelectMultiple(successfullyUploaded);
        onClose();
      } else if (!multiple && successfullyUploaded.length > 0) {
        onSelect(successfullyUploaded[0]);
        onClose();
      }
    }
  };

  return (
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
                  Media &amp; Asset Picker
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Target: {targetSectionLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cloudflare R2 Storage • JPEG, PNG, WebP &amp; SVG Safe Handling
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

        {/* Tab Controls */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "library"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Media Library ({mediaList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "upload"
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload New {uploadFiles.length > 0 && `(${uploadFiles.length})`}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: MEDIA LIBRARY */}
          {activeTab === "library" && (
            <div className="space-y-4">
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by filename or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === "all"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Grid */}
              {loadingMedia ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span>Loading assets from Cloudflare R2...</span>
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    No matching assets found
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Switch to the &quot;Upload New&quot; tab to add assets directly to Cloudflare R2.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("upload")}
                    className="text-xs gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Assets Now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedItems.some(
                      (s) => s.url === item.public_url
                    );
                    const isSvg = item.content_type?.includes("svg");

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemSelection(item)}
                        className={`group relative rounded-xl border-2 overflow-hidden bg-slate-50 cursor-pointer transition-all ${
                          isSelected
                            ? "border-purple-600 ring-2 ring-purple-600/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="relative aspect-square w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                          {/* Safe Image Render */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.public_url}
                            alt={item.alt_text || item.file_name}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            loading="lazy"
                          />

                          {isSelected && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                            </div>
                          )}

                          {isSvg && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white">
                              SVG
                            </span>
                          )}
                        </div>

                        <div className="p-2 bg-white">
                          <p
                            className="text-[11px] font-semibold text-slate-800 truncate"
                            title={item.file_name}
                          >
                            {item.file_name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="capitalize">{item.category || "general"}</span>
                            <span>{Math.round((item.file_size || 0) / 1024)} KB</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD NEW */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragActive
                    ? "border-purple-600 bg-purple-50/50"
                    : "border-slate-300 hover:border-purple-400 bg-slate-50/50"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Drag &amp; drop images or folder here
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Supports JPEG, PNG, WebP, SVG (safely sanitized) up to 10 MB per file.
                </p>

                <div className="flex items-center justify-center gap-3 mt-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFilesToStaging(e.target.files);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Select Files
                  </Button>

                  {/* Directory / Folder Upload */}
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory is supported in Chromium/Firefox
                    webkitdirectory="true"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addFilesToStaging(e.target.files);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => folderInputRef.current?.click()}
                    className="text-xs gap-1.5"
                    title="Upload entire folder of images"
                  >
                    <FolderUp className="w-3.5 h-3.5 text-blue-600" />
                    Upload Folder
                  </Button>
                </div>
              </div>

              {/* Upload Staging List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Files Ready to Upload ({uploadFiles.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadFiles([])}
                      disabled={isUploading}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {uploadFiles.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center gap-3 bg-white hover:bg-slate-50 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt="preview"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                        />

                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {item.file.name}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              {(item.file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          <div>
                            <input
                              type="text"
                              placeholder="Alt text / description"
                              value={item.altText}
                              disabled={isUploading || item.status === "success"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUploadFiles((prev) =>
                                  prev.map((f, idx) =>
                                    idx === index ? { ...f, altText: val } : f
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                            />
                          </div>

                          <div>
                            <select
                              value={item.category}
                              disabled={isUploading || item.status === "success"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setUploadFiles((prev) =>
                                  prev.map((f, idx) =>
                                    idx === index ? { ...f, category: val } : f
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-purple-600 focus:outline-none"
                            >
                              <option value="general">General</option>
                              <option value="gallery">Gallery</option>
                              <option value="team">Team</option>
                              <option value="hero">Hero / Banners</option>
                              <option value="campus">Campus</option>
                            </select>
                          </div>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0">
                          {item.status === "pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                setUploadFiles((prev) =>
                                  prev.filter((_, idx) => idx !== index)
                                )
                              }
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
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

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={isUploading || uploadFiles.length === 0}
                      onClick={handleStartUpload}
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading to Cloudflare R2...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload &amp; Use Selected ({uploadFiles.length})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500">
            {activeTab === "library" && (
              <span>
                {selectedItems.length} asset{selectedItems.length !== 1 ? "s" : ""} selected
              </span>
            )}
            {activeTab === "upload" && (
              <span>Uploads are securely indexed in your Cloudflare R2 bucket.</span>
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

            {activeTab === "library" && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={selectedItems.length === 0}
                onClick={handleConfirmLibrarySelection}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Select ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
