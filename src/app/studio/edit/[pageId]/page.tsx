"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Save,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  History,
  Layers,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Upload,
  FolderUp,
  FileSpreadsheet,
  MoveUp,
  MoveDown,
  Star,
  Check,
  Search,
  Filter,
  Monitor,
  Tablet,
  Smartphone,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MediaPickerModal, SelectedMediaItem } from "@/components/studio/imports/MediaPickerModal";
import { GalleryImportModal, ImportedGalleryItem } from "@/components/studio/imports/GalleryImportModal";
import { TeamCsvImportModal } from "@/components/studio/imports/TeamCsvImportModal";
import { DocumentImportModal } from "@/components/studio/imports/DocumentImportModal";
import { NavigationImportModal } from "@/components/studio/imports/NavigationImportModal";
import { TeamMember, TeamCategory } from "@/types";

function StudioEditContent() {
  const params = useParams();
  const router = useRouter();
  const pageId = (params?.pageId as string) || "";

  const [page, setPage] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Revision history state
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [revertingVersion, setRevertingVersion] = useState<number | null>(null);

  // Publish Modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");

  // Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Modals state for Context-Aware Imports
  const [openMediaPicker, setOpenMediaPicker] = useState(false);
  const [mediaPickerContext, setMediaPickerContext] = useState<{
    target: string;
    multiple?: boolean;
    category?: string;
    index?: number;
    label?: string;
  }>({ target: "", multiple: false, category: "general", label: "Media" });

  const [openGalleryImportModal, setOpenGalleryImportModal] = useState(false);
  const [openTeamCsvModal, setOpenTeamCsvModal] = useState(false);
  const [openDocImportModal, setOpenDocImportModal] = useState(false);
  const [openNavImportModal, setOpenNavImportModal] = useState(false);

  // Gallery Controls State
  const [selectedGalleryIndices, setSelectedGalleryIndices] = useState<number[]>([]);
  const [galleryBulkCategory, setGalleryBulkCategory] = useState("Hackathons");
  const [galleryBulkYear, setGalleryBulkYear] = useState("2026");
  const [galleryPreviewDevice, setGalleryPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Team Category Filter
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<string>("All");

  // Global Nav Preview Device
  const [navPreviewDevice, setNavPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studio/pages/${pageId}`);
      if (!res.ok) throw new Error("Failed to load page");
      const data = await res.json();
      if (data.success && data.page) {
        setPage(data.page);
        // Load draft content if present, else published content
        const activeContent = data.page.draft_content || data.page.published_content || {};
        setFormData(JSON.parse(JSON.stringify(activeContent)));
      }
    } catch {
      setErrorNotice("Could not load page data from CMS database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageId) fetchPageData();
  }, [pageId]);

  const fetchRevisions = async () => {
    try {
      setLoadingRevisions(true);
      const res = await fetch(`/api/studio/pages/${pageId}/revisions`);
      const data = await res.json();
      if (data.success) {
        setRevisions(data.revisions || []);
      }
    } catch {
      console.warn("Failed to fetch revision history");
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleSaveDraft = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);
    setSavingDraft(true);

    try {
      const res = await fetch(`/api/studio/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftContent: formData }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice("Draft saved successfully. Content is preserved in draft mode.");
        setPage((prev: any) => ({ ...prev, status: "modified" }));
      } else {
        setErrorNotice(data.error || "Failed to save draft.");
      }
    } catch {
      setErrorNotice("Network error while saving draft.");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleConfirmPublish = async () => {
    setErrorNotice(null);
    setSuccessNotice(null);
    setPublishing(true);

    try {
      // First save draft to make sure latest fields are recorded
      await fetch(`/api/studio/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftContent: formData }),
      });

      // Then publish
      const res = await fetch(`/api/studio/pages/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowPublishModal(false);
        setChangeSummary("");
        setSuccessNotice(`Page published live (Revision #${data.newVersion})! Public site cache updated.`);
        fetchPageData();
      } else {
        setErrorNotice(data.error || "Failed to publish page.");
      }
    } catch {
      setErrorNotice("Network error while publishing.");
    } finally {
      setPublishing(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!confirm(`Are you sure you want to rollback to Revision #${version}? This will overwrite the live page with that version.`)) {
      return;
    }

    setRevertingVersion(version);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const res = await fetch(`/api/studio/pages/${pageId}/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessNotice(`Successfully rolled back to Revision #${version}!`);
        setShowRevisions(false);
        fetchPageData();
      } else {
        setErrorNotice(data.error || "Failed to rollback.");
      }
    } catch {
      setErrorNotice("Network error during rollback.");
    } finally {
      setRevertingVersion(null);
    }
  };

  // Media Picker Callback Handlers
  const handleMediaPickerSelect = (item: SelectedMediaItem) => {
    const { target, index } = mediaPickerContext;

    if (target === "galleryReplace" && typeof index === "number") {
      const updated = [...(formData.galleryItems || [])];
      if (updated[index]) {
        updated[index].imageUrl = item.url;
        if (item.altText && !updated[index].altText) updated[index].altText = item.altText;
        setFormData({ ...formData, galleryItems: updated });
        setSuccessNotice(`Replaced photo for item #${index + 1}.`);
      }
    } else if (target === "teamPhoto" && typeof index === "number") {
      const updated = [...(formData.members || [])];
      if (updated[index]) {
        updated[index].imageUrl = item.url;
        setFormData({ ...formData, members: updated });
        setSuccessNotice(`Updated photo for ${updated[index].name}.`);
      }
    } else if (target === "heroBg") {
      setFormData({
        ...formData,
        hero: { ...(formData.hero || {}), bgImage: item.url },
      });
      setSuccessNotice("Updated hero background image.");
    } else if (target === "heroIllustration") {
      setFormData({
        ...formData,
        hero: { ...(formData.hero || {}), illustrationUrl: item.url },
      });
      setSuccessNotice("Updated hero illustration.");
    } else if (target === "aboutStoryImage") {
      setFormData({
        ...formData,
        narrative: { ...(formData.narrative || {}), storyImage: item.url },
      });
      setSuccessNotice("Updated campus story image.");
    } else if (target === "contactMapImage") {
      setFormData({
        ...formData,
        contactInfo: { ...(formData.contactInfo || {}), mapImage: item.url },
      });
      setSuccessNotice("Updated campus location graphic.");
    }
  };

  const handleMediaPickerSelectMultiple = (items: SelectedMediaItem[]) => {
    if (mediaPickerContext.target === "galleryBulk") {
      const newItems = items.map((it, idx) => ({
        id: `gal-${Date.now()}-${idx}`,
        title: it.altText || it.fileName.replace(/\.[^/.]+$/, ""),
        category: "Hackathons",
        imageUrl: it.url,
        year: "2026",
        caption: `Documentation archive of ${it.fileName}`,
        altText: it.altText || it.fileName,
        isFeatured: false,
      }));
      setFormData({
        ...formData,
        galleryItems: [...(formData.galleryItems || []), ...newItems],
      });
      setSuccessNotice(`Added ${items.length} assets from Media Library to gallery draft.`);
    }
  };

  // Section Importers Callbacks
  const handleGalleryImport = (newItems: ImportedGalleryItem[]) => {
    setFormData({
      ...formData,
      galleryItems: [...(formData.galleryItems || []), ...newItems],
    });
    setSuccessNotice(`Successfully imported ${newItems.length} photos into gallery draft.`);
  };

  const handleTeamImport = (updatedMembers: TeamMember[]) => {
    setFormData({
      ...formData,
      members: updatedMembers,
    });
    setSuccessNotice(`Successfully updated team roster draft (${updatedMembers.length} members).`);
  };

  const handleDocumentImport = (mappedData: Record<string, any>) => {
    setFormData(mappedData);
    setSuccessNotice("Successfully imported document content into working draft.");
  };

  const handleNavImport = (links: Array<{ label: string; href: string; isExternal?: boolean }>) => {
    setFormData({
      ...formData,
      navbar: {
        ...(formData.navbar || {}),
        links,
      },
    });
    setSuccessNotice(`Successfully imported ${links.length} validated navigation links into draft.`);
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        <span>Loading schema content from CMS database...</span>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Page Not Found</h2>
        <p className="text-xs text-slate-500">The requested CMS content section was not found.</p>
        <Link href="/studio" className="inline-block px-4 py-2 text-xs font-semibold rounded-md bg-purple-600 text-white">
          Back to Studio Overview
        </Link>
      </div>
    );
  }

  const slug = page.slug;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="sticky top-16 z-30 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <Link
            href="/studio"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Studio Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="min-w-0 break-words text-base font-bold text-slate-900 sm:text-xl">{page.title}</h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  page.status === "modified"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                {page.status === "modified" ? "Draft Changes" : "Published"}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                rev #{page.current_revision || 1}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">slug: {page.slug}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowRevisions(true);
              fetchRevisions();
            }}
            className="text-xs gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            Revisions
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreviewModal(true)}
            className="text-xs gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            Inspect Draft
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={savingDraft || publishing}
            onClick={handleSaveDraft}
            className="text-xs gap-1.5"
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={savingDraft || publishing}
            onClick={() => setShowPublishModal(true)}
            className="text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Send className="w-3.5 h-3.5" />
            Publish Changes
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">Success</p>
            <p className="text-emerald-700">{successNotice}</p>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-800">
            &times;
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Notice</p>
            <p className="text-red-700">{errorNotice}</p>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-red-600 hover:text-red-800">
            &times;
          </button>
        </div>
      )}

      {/* Dynamic Content Form Based on Page Slug */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-8">
        
        {/* ========================================================================= */}
        {/* ===================== HOME PAGE EDITOR & IMPORTS ======================== */}
        {/* ========================================================================= */}
        {slug === "home" && (
          <div className="space-y-8">
            {/* Top Section Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Hero Section &amp; Main Banners
                </h2>
                <p className="text-xs text-slate-500">
                  Manage headline copy, background visuals, CTAs, and featured announcement.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDocImportModal(true)}
                  className="text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Import Copy Document
                </Button>
              </div>
            </div>

            {/* Visual Assets Row (Background & Illustration) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hero Background Visual */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Hero Background Image</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMediaPickerContext({
                        target: "heroBg",
                        multiple: false,
                        category: "hero",
                        label: "Hero Background Image",
                      });
                      setOpenMediaPicker(true);
                    }}
                    className="text-xs gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                    {formData.hero?.bgImage ? "Replace Image" : "Select from R2"}
                  </Button>
                </div>

                {formData.hero?.bgImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.hero.bgImage}
                      alt="Hero background"
                      className="w-full h-full object-cover opacity-80"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          hero: { ...formData.hero, bgImage: "" },
                        })
                      }
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700 text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-400">
                    No custom background set (using default gradient)
                  </div>
                )}
              </div>

              {/* Hero Illustration / Badge Visual */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Hero Illustration / Graphic</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMediaPickerContext({
                        target: "heroIllustration",
                        multiple: false,
                        category: "hero",
                        label: "Hero Graphic",
                      });
                      setOpenMediaPicker(true);
                    }}
                    className="text-xs gap-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    {formData.hero?.illustrationUrl ? "Replace Graphic" : "Choose Graphic"}
                  </Button>
                </div>

                {formData.hero?.illustrationUrl ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.hero.illustrationUrl}
                      alt="Hero illustration"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          hero: { ...formData.hero, illustrationUrl: "" },
                        })
                      }
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded hover:bg-red-700 text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center border border-dashed border-slate-300 rounded-lg text-xs text-slate-400">
                    No custom graphic selected (using standard chapter seal)
                  </div>
                )}
              </div>
            </div>

            {/* Headline Copy & Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Badge Text</label>
                <input
                  type="text"
                  value={formData.hero?.badge || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, badge: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highlighted Accent Word</label>
                <input
                  type="text"
                  value={formData.hero?.highlightedWord || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, highlightedWord: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title Prefix</label>
              <input
                type="text"
                value={formData.hero?.titlePrefix || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, titlePrefix: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Narrative Lead</label>
              <textarea
                rows={3}
                value={formData.hero?.description || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hero: { ...formData.hero, description: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">Primary Action Button</span>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={formData.hero?.primaryButtonText || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, primaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={formData.hero?.primaryButtonLink || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, primaryButtonLink: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">Secondary Action Button</span>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={formData.hero?.secondaryButtonText || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, secondaryButtonText: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={formData.hero?.secondaryButtonLink || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hero: { ...formData.hero, secondaryButtonLink: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Announcement Strip</span>
                <label className="flex items-center gap-2 text-xs text-purple-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.announcement?.enabled)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        announcement: {
                          ...formData.announcement,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Display on Home Page</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-purple-900 mb-1">Badge</label>
                  <input
                    type="text"
                    value={formData.announcement?.badge || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        announcement: { ...formData.announcement, badge: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-purple-900 mb-1">Announcement Copy</label>
                  <input
                    type="text"
                    value={formData.announcement?.text || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        announcement: { ...formData.announcement, text: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Events Management Preservation Notice */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Events Management Integration Preserved</p>
                <p className="text-blue-700 text-[11px] mt-0.5 leading-relaxed">
                  Collegiate events, registrations, Google Sheets automations, and certificate verifications are strictly managed through the secure <strong>/admin</strong> console. Studio handles presentation banners and promotional copy without duplicating event databases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ===================== ABOUT PAGE EDITOR & IMPORTS ======================= */}
        {/* ========================================================================= */}
        {slug === "about" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  About Chapter Narrative &amp; Mission
                </h2>
                <p className="text-xs text-slate-500">
                  Author narrative leads, official mission, vision statements, and academic pillars.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDocImportModal(true)}
                  className="text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Import Document (MD / TXT / HTML / JSON)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={formData.hero?.title || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.hero?.tagline || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hero: { ...formData.hero, tagline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Narrative Lead Paragraph</label>
              <textarea
                rows={4}
                value={formData.narrative?.lead || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    narrative: { ...formData.narrative, lead: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Mission Statement</label>
                <textarea
                  rows={4}
                  value={formData.mission || ""}
                  onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Vision Statement</label>
                <textarea
                  rows={4}
                  value={formData.vision || ""}
                  onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Academic Pillars Management */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">Academic Pillars &amp; Core Focus Areas</span>
                  <span className="text-[11px] text-slate-400 block">Structured pedagogical domains represented on the About page</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPillar = {
                      title: "New Focus Area",
                      description: "Description of core competency and activities.",
                    };
                    setFormData({
                      ...formData,
                      academicPillars: [...(formData.academicPillars || []), newPillar],
                    });
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pillar
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(formData.academicPillars || []).map((pillar: any, index: number) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Pillar #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.academicPillars.filter((_: any, i: number) => i !== index);
                          setFormData({ ...formData, academicPillars: updated });
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={pillar.title || ""}
                      onChange={(e) => {
                        const updated = [...formData.academicPillars];
                        updated[index].title = e.target.value;
                        setFormData({ ...formData, academicPillars: updated });
                      }}
                      placeholder="Title"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                    />

                    <textarea
                      rows={2}
                      value={pillar.description || ""}
                      onChange={(e) => {
                        const updated = [...formData.academicPillars];
                        updated[index].description = e.target.value;
                        setFormData({ ...formData, academicPillars: updated });
                      }}
                      placeholder="Description"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ===================== TEAM PAGE EDITOR & IMPORTS ======================== */}
        {/* ========================================================================= */}
        {slug === "team" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Leadership, Faculty &amp; Executive Council Members
                </h2>
                <p className="text-xs text-slate-500">
                  {formData.members?.length || 0} active council members • Batch CSV import &amp; photo matching available.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenTeamCsvModal(true)}
                  className="text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  Import Roster from CSV
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newMember = {
                      id: `team-${Date.now()}`,
                      name: "New Member",
                      role: "Officer",
                      category: "Office Bearers",
                      department: "Computer Science and Engineering",
                      bio: "Student officer biography.",
                      imageUrl: "/images/team/placeholder.jpg",
                    };
                    setFormData({
                      ...formData,
                      members: [...(formData.members || []), newMember],
                    });
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Member
                </Button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {["All", "Faculty", "Office Bearers", "Technical Leads", "Committee Leads"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTeamCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                    teamCategoryFilter === cat
                      ? "bg-[#14213d] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Members List */}
            <div className="space-y-4">
              {(formData.members || [])
                .map((member: any, index: number) => ({ member, index }))
                .filter(({ member }: any) =>
                  teamCategoryFilter === "All" ? true : member.category === teamCategoryFilter
                )
                .map(({ member, index }: any) => (
                  <div key={member.id || index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          #{index + 1}: {member.name || "Untitled Member"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {member.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const updated = [...formData.members];
                            const temp = updated[index];
                            updated[index] = updated[index - 1];
                            updated[index - 1] = temp;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === formData.members.length - 1}
                          onClick={() => {
                            const updated = [...formData.members];
                            const temp = updated[index];
                            updated[index] = updated[index + 1];
                            updated[index + 1] = temp;
                            setFormData({ ...formData, members: updated });
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.members.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, members: updated });
                          }}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                      {/* Photo Thumbnail & Replace */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden border border-slate-300">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={member.imageUrl || "/images/team/placeholder.jpg"}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMediaPickerContext({
                              target: "teamPhoto",
                              index,
                              category: "team",
                              multiple: false,
                              label: `Photo for ${member.name}`,
                            });
                            setOpenMediaPicker(true);
                          }}
                          className="text-[10px] px-2 py-0.5"
                        >
                          Change Photo
                        </Button>
                      </div>

                      <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Full Name</label>
                          <input
                            type="text"
                            value={member.name || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].name = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Designation / Role</label>
                          <input
                            type="text"
                            value={member.role || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].role = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
                          <select
                            value={member.category || "Office Bearers"}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].category = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          >
                            <option value="Faculty">Faculty Advisory</option>
                            <option value="Office Bearers">Office Bearers</option>
                            <option value="Technical Leads">Technical Leads</option>
                            <option value="Committee Leads">Committee Leads</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Department</label>
                          <input
                            type="text"
                            value={member.department || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].department = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Email (Optional)</label>
                          <input
                            type="email"
                            value={member.email || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].email = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            placeholder="user@iare.ac.in"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">Short Biography</label>
                          <textarea
                            rows={2}
                            value={member.bio || ""}
                            onChange={(e) => {
                              const updated = [...formData.members];
                              updated[index].bio = e.target.value;
                              setFormData({ ...formData, members: updated });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ===================== GALLERY PAGE EDITOR & IMPORTS ===================== */}
        {/* ========================================================================= */}
        {slug === "gallery" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Photographic Archives &amp; Achievements
                </h2>
                <p className="text-xs text-slate-500">
                  Manage {formData.galleryItems?.length || 0} documented events • Bulk upload, folder support, categories, and layout controls.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenGalleryImportModal(true)}
                  className="text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <FolderUp className="w-3.5 h-3.5 text-purple-600" />
                  Import Photos &amp; Albums
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMediaPickerContext({
                      target: "galleryBulk",
                      multiple: true,
                      category: "gallery",
                      label: "Gallery Collection",
                    });
                    setOpenMediaPicker(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  Select from Media Library
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newItem = {
                      id: `gal-${Date.now()}`,
                      title: "New Gallery Entry",
                      category: "Hackathons",
                      imageUrl: "/images/gallery/placeholder.jpg",
                      year: "2026",
                      date: "2026-03-15",
                      caption: "Photographic record",
                      altText: "ACM event photo",
                      isFeatured: false,
                    };
                    setFormData({
                      ...formData,
                      galleryItems: [...(formData.galleryItems || []), newItem],
                    });
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Single Entry
                </Button>
              </div>
            </div>

            {/* Layout Configuration Bar */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  Gallery Layout &amp; Responsive Grid Controls
                </span>

                {/* Device Preview Mode */}
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium mr-1">Preview:</span>
                  <button
                    type="button"
                    onClick={() => setGalleryPreviewDevice("desktop")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      galleryPreviewDevice === "desktop" ? "bg-slate-900 text-white" : "bg-white border text-slate-700"
                    }`}
                  >
                    <Monitor className="w-3 h-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryPreviewDevice("tablet")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      galleryPreviewDevice === "tablet" ? "bg-slate-900 text-white" : "bg-white border text-slate-700"
                    }`}
                  >
                    <Tablet className="w-3 h-3" /> Tablet
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalleryPreviewDevice("mobile")}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                      galleryPreviewDevice === "mobile" ? "bg-slate-900 text-white" : "bg-white border text-slate-700"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> Mobile
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Columns on Desktop
                  </label>
                  <select
                    value={formData.layout?.columns || 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: { ...formData.layout, columns: Number(e.target.value) },
                      })
                    }
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value={2}>2 Columns (Spacious)</option>
                    <option value={3}>3 Columns (Standard)</option>
                    <option value={4}>4 Columns (Dense Grid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Grid Gap Spacing
                  </label>
                  <select
                    value={formData.layout?.gap || "normal"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: { ...formData.layout, gap: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="compact">Compact (12px)</option>
                    <option value="normal">Normal (24px)</option>
                    <option value="spacious">Spacious (36px)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Photo Aspect Ratio
                  </label>
                  <select
                    value={formData.layout?.aspectRatio || "16/10"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: { ...formData.layout, aspectRatio: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="16/10">16:10 (Wide Aspect)</option>
                    <option value="16/9">16:9 (Cinematic)</option>
                    <option value="4/3">4:3 (Traditional Camera)</option>
                    <option value="1/1">1:1 (Square)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedGalleryIndices.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-bold text-purple-900">
                  {selectedGalleryIndices.length} item(s) selected
                </span>

                <div className="flex items-center gap-2">
                  <select
                    value={galleryBulkCategory}
                    onChange={(e) => setGalleryBulkCategory(e.target.value)}
                    className="px-2 py-1 text-xs border border-purple-200 rounded bg-white text-slate-800"
                  >
                    <option value="Hackathons">Hackathons</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Community">Community</option>
                    <option value="Celebrations">Celebrations</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...formData.galleryItems];
                      selectedGalleryIndices.forEach((idx) => {
                        if (updated[idx]) updated[idx].category = galleryBulkCategory;
                      });
                      setFormData({ ...formData, galleryItems: updated });
                      setSuccessNotice(`Updated category for ${selectedGalleryIndices.length} items.`);
                    }}
                    className="px-2 py-1 bg-purple-600 text-white rounded font-semibold hover:bg-purple-700"
                  >
                    Set Category
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${selectedGalleryIndices.length} items from gallery draft? (Assets in R2 storage will not be deleted).`)) {
                        const updated = formData.galleryItems.filter(
                          (_: any, idx: number) => !selectedGalleryIndices.includes(idx)
                        );
                        setFormData({ ...formData, galleryItems: updated });
                        setSelectedGalleryIndices([]);
                        setSuccessNotice("Removed selected items from gallery.");
                      }
                    }}
                    className="px-2 py-1 bg-red-600 text-white rounded font-semibold hover:bg-red-700 flex items-center gap-1 ml-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected
                  </button>
                </div>
              </div>
            )}

            {/* Gallery Cards Container with Responsive Preview Container */}
            <div
              className={`transition-all mx-auto ${
                galleryPreviewDevice === "tablet"
                  ? "max-w-2xl border-x-4 border-slate-300 p-3 bg-slate-100 rounded-xl"
                  : galleryPreviewDevice === "mobile"
                  ? "max-w-sm border-x-8 border-slate-400 p-2 bg-slate-100 rounded-2xl"
                  : "w-full"
              }`}
            >
              <div
                className={`grid gap-4 ${
                  galleryPreviewDevice === "mobile"
                    ? "grid-cols-1"
                    : galleryPreviewDevice === "tablet"
                    ? "grid-cols-2"
                    : formData.layout?.columns === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : formData.layout?.columns === 4
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                }`}
              >
                {(formData.galleryItems || []).map((item: any, index: number) => {
                  const isSelected = selectedGalleryIndices.includes(index);
                  return (
                    <div
                      key={item.id || index}
                      className={`p-3.5 bg-white border rounded-xl space-y-2.5 transition-shadow hover:shadow-xs ${
                        isSelected ? "border-purple-600 ring-2 ring-purple-600/20" : "border-slate-200"
                      }`}
                    >
                      {/* Image Preview with Replace Photo & Star Toggle */}
                      <div className="relative aspect-[16/10] w-full rounded-lg bg-slate-900 overflow-hidden border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Top Left: Checkbox & Featured Badge */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGalleryIndices([...selectedGalleryIndices, index]);
                              } else {
                                setSelectedGalleryIndices(selectedGalleryIndices.filter((i) => i !== index));
                              }
                            }}
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-white/90"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.galleryItems];
                              updated[index].isFeatured = !updated[index].isFeatured;
                              setFormData({ ...formData, galleryItems: updated });
                            }}
                            className={`p-1 rounded-full backdrop-blur-xs transition-colors ${
                              item.isFeatured ? "bg-amber-500 text-white" : "bg-black/40 text-white hover:text-amber-400"
                            }`}
                            title="Toggle Featured Image"
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFeatured ? "fill-white" : ""}`} />
                          </button>
                        </div>

                        {/* Top Right: Reorder Up/Down */}
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-md text-white">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              const updated = [...formData.galleryItems];
                              const temp = updated[index];
                              updated[index] = updated[index - 1];
                              updated[index - 1] = temp;
                              setFormData({ ...formData, galleryItems: updated });
                            }}
                            className="p-0.5 hover:text-purple-300 disabled:opacity-20"
                            title="Move Earlier"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === formData.galleryItems.length - 1}
                            onClick={() => {
                              const updated = [...formData.galleryItems];
                              const temp = updated[index];
                              updated[index] = updated[index + 1];
                              updated[index + 1] = temp;
                              setFormData({ ...formData, galleryItems: updated });
                            }}
                            className="p-0.5 hover:text-purple-300 disabled:opacity-20"
                            title="Move Later"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom: Replace Photo button */}
                        <div className="absolute bottom-2 right-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaPickerContext({
                                target: "galleryReplace",
                                index,
                                category: "gallery",
                                multiple: false,
                                label: `Replace Photo for item #${index + 1}`,
                              });
                              setOpenMediaPicker(true);
                            }}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-white/90 text-slate-800 rounded hover:bg-white shadow-xs"
                          >
                            Replace Photo
                          </button>
                        </div>
                      </div>

                      {/* Fields */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                          Title / Caption
                        </label>
                        <input
                          type="text"
                          value={item.title || ""}
                          onChange={(e) => {
                            const updated = [...formData.galleryItems];
                            updated[index].title = e.target.value;
                            setFormData({ ...formData, galleryItems: updated });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Category
                          </label>
                          <select
                            value={item.category || "Hackathons"}
                            onChange={(e) => {
                              const updated = [...formData.galleryItems];
                              updated[index].category = e.target.value;
                              setFormData({ ...formData, galleryItems: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          >
                            <option value="Hackathons">Hackathons</option>
                            <option value="Workshops">Workshops</option>
                            <option value="Community">Community</option>
                            <option value="Celebrations">Celebrations</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                            Year
                          </label>
                          <input
                            type="text"
                            value={item.year || "2026"}
                            onChange={(e) => {
                              const updated = [...formData.galleryItems];
                              updated[index].year = e.target.value;
                              setFormData({ ...formData, galleryItems: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.galleryItems.filter((_: any, i: number) => i !== index);
                            setFormData({ ...formData, galleryItems: updated });
                          }}
                          className="text-red-500 hover:text-red-700 text-[11px] font-semibold flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ===================== CONTACT PAGE EDITOR & IMPORTS ===================== */}
        {/* ========================================================================= */}
        {slug === "contact" && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Contact Channels, Office Hours &amp; Membership Details
              </h2>
              <p className="text-xs text-slate-500">
                Edit official correspondence emails, campus directions, and membership perks. Active student application forms remain operational.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">General Chapter Email</label>
                <input
                  type="email"
                  value={formData.contactInfo?.email || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Advisor Email</label>
                <input
                  type="email"
                  value={formData.contactInfo?.facultyEmail || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, facultyEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">College Telephone Numbers</label>
                <input
                  type="text"
                  value={formData.contactInfo?.phone || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Map Link</label>
                <input
                  type="text"
                  value={formData.contactInfo?.mapUrl || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contactInfo: { ...formData.contactInfo, mapUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Physical Postal Address</label>
              <textarea
                rows={3}
                value={formData.contactInfo?.address || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, address: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            {/* Form Integration Assurance */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Active Registration &amp; Inquiry Forms Preserved</p>
                <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
                  The live membership registration flow (/api/join) and student inquiry endpoint (/api/contact) continue processing submissions directly into Neon PostgreSQL and Google Sheets.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ===================== GLOBAL NAVIGATION & FOOTER ======================== */}
        {/* ========================================================================= */}
        {slug === "global" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Site-Wide Navigation &amp; Social Links
                </h2>
                <p className="text-xs text-slate-500">
                  Manage main header links, security guards against private route leaks, and official footer metadata.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenNavImportModal(true)}
                  className="text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Link2 className="w-3.5 h-3.5 text-purple-600" />
                  Import Navigation Links (JSON/CSV)
                </Button>
              </div>
            </div>

            {/* Navigation Links Manager */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Active Public Menu Items ({(formData.navbar?.links || []).length})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newLink = { label: "New Page", href: "/" };
                    setFormData({
                      ...formData,
                      navbar: {
                        ...(formData.navbar || {}),
                        links: [...(formData.navbar?.links || []), newLink],
                      },
                    });
                  }}
                  className="text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </Button>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {(formData.navbar?.links || []).map((link: any, index: number) => {
                  const isRestricted =
                    link.href?.startsWith("/admin") ||
                    link.href?.startsWith("/studio") ||
                    link.href?.startsWith("javascript:");
                  return (
                    <div
                      key={index}
                      className={`p-3 flex items-center gap-3 ${
                        isRestricted ? "bg-red-50/70" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            const updated = [...formData.navbar.links];
                            const temp = updated[index];
                            updated[index] = updated[index - 1];
                            updated[index - 1] = temp;
                            setFormData({
                              ...formData,
                              navbar: { ...formData.navbar, links: updated },
                            });
                          }}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === formData.navbar.links.length - 1}
                          onClick={() => {
                            const updated = [...formData.navbar.links];
                            const temp = updated[index];
                            updated[index] = updated[index + 1];
                            updated[index + 1] = temp;
                            setFormData({
                              ...formData,
                              navbar: { ...formData.navbar, links: updated },
                            });
                          }}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={link.label || ""}
                          onChange={(e) => {
                            const updated = [...formData.navbar.links];
                            updated[index].label = e.target.value;
                            setFormData({
                              ...formData,
                              navbar: { ...formData.navbar, links: updated },
                            });
                          }}
                          placeholder="Label"
                          className="px-2 py-1 text-xs border border-slate-300 rounded font-semibold"
                        />

                        <input
                          type="text"
                          value={link.href || ""}
                          onChange={(e) => {
                            const updated = [...formData.navbar.links];
                            updated[index].href = e.target.value;
                            setFormData({
                              ...formData,
                              navbar: { ...formData.navbar, links: updated },
                            });
                          }}
                          placeholder="/route or https://..."
                          className="px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                        />
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isRestricted && (
                          <div title="SECURITY BLOCK: Restricted administrative route exposed!">
                            <ShieldAlert className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.navbar.links.filter((_: any, i: number) => i !== index);
                            setFormData({
                              ...formData,
                              navbar: { ...formData.navbar, links: updated },
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Copy & Social Links */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block">Footer Metadata &amp; Social Channels</span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Footer Description</label>
                <textarea
                  rows={3}
                  value={formData.footer?.description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      footer: { ...formData.footer, description: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                  <input
                    type="text"
                    value={formData.footer?.socials?.linkedin || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        footer: {
                          ...formData.footer,
                          socials: { ...formData.footer?.socials, linkedin: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Organization</label>
                  <input
                    type="text"
                    value={formData.footer?.socials?.github || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        footer: {
                          ...formData.footer,
                          socials: { ...formData.footer?.socials, github: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instagram Handle URL</label>
                  <input
                    type="text"
                    value={formData.footer?.socials?.instagram || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        footer: {
                          ...formData.footer,
                          socials: { ...formData.footer?.socials, instagram: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Twitter / X URL</label>
                  <input
                    type="text"
                    value={formData.footer?.socials?.twitter || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        footer: {
                          ...formData.footer,
                          socials: { ...formData.footer?.socials, twitter: e.target.value },
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ===================== PUBLISH CONFIRMATION MODAL ===================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Page Updates</h3>
                <p className="text-xs text-slate-500">Live Website Deployment</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This action will publish all changes directly to the public website, create Revision #
              {(page.current_revision || 1) + 1}, and revalidate the page cache.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Summary / Release Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Updated leadership council and hero copy"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPublishModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={publishing}
                onClick={handleConfirmPublish}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Publishing...
                  </>
                ) : (
                  "Confirm & Publish Live"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== REVISION HISTORY DRAWER / MODAL ===================== */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revision History &amp; Rollback</h3>
                  <p className="text-xs text-slate-500">Every published version is preserved for rollback.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRevisions ? (
                <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  Loading historical revisions...
                </div>
              ) : revisions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No historical revisions found for this section.
                </div>
              ) : (
                revisions.map((rev) => {
                  const isCurrent = rev.version === page.current_revision;
                  return (
                    <div
                      key={rev.id}
                      className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-4 ${
                        isCurrent
                          ? "bg-purple-50/60 border-purple-200"
                          : "bg-slate-50/80 border-slate-200 hover:bg-slate-100/70"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Revision #{rev.version}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                              Active Live
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px]">{rev.change_summary || "Published content update"}</p>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rev.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}{" "}
                          • by {rev.created_by || "system"}
                        </div>
                      </div>

                      {!isCurrent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revertingVersion === rev.version}
                          onClick={() => handleRollback(rev.version)}
                          className="text-xs shrink-0 gap-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          {revertingVersion === rev.version ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          Rollback
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRevisions(false)}
                className="text-xs"
              >
                Close Revisions
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PREVIEW MODAL ===================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Draft Content JSON Inspector</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-[11px] leading-relaxed">
              <pre>{JSON.stringify(formData, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Draft content is isolated and invisible to public visitors until published.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="text-xs"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CONTEXTUAL MODALS ===================== */}
      {/* 1. Reusable Media Picker */}
      <MediaPickerModal
        isOpen={openMediaPicker}
        onClose={() => setOpenMediaPicker(false)}
        multiple={Boolean(mediaPickerContext.multiple)}
        category={mediaPickerContext.category || "general"}
        targetSectionLabel={mediaPickerContext.label || "Current Section"}
        onSelect={handleMediaPickerSelect}
        onSelectMultiple={handleMediaPickerSelectMultiple}
      />

      {/* 2. Gallery Importer */}
      <GalleryImportModal
        isOpen={openGalleryImportModal}
        onClose={() => setOpenGalleryImportModal(false)}
        onImport={handleGalleryImport}
        existingCount={formData.galleryItems?.length || 0}
      />

      {/* 3. Team CSV Importer */}
      <TeamCsvImportModal
        isOpen={openTeamCsvModal}
        onClose={() => setOpenTeamCsvModal(false)}
        onImport={handleTeamImport}
        existingMembers={formData.members || []}
      />

      {/* 4. Document Importer (About & Home) */}
      <DocumentImportModal
        isOpen={openDocImportModal}
        onClose={() => setOpenDocImportModal(false)}
        onImport={handleDocumentImport}
        targetSection={slug === "home" ? "home" : "about"}
        currentData={formData}
      />

      {/* 5. Navigation Links Importer */}
      <NavigationImportModal
        isOpen={openNavImportModal}
        onClose={() => setOpenNavImportModal(false)}
        onImportNav={handleNavImport}
        currentLinks={formData.navbar?.links || []}
      />

    </div>
  );
}

export default function StudioEditPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium tracking-wide">Loading Studio Editor...</p>
          </div>
        </div>
      }
    >
      <StudioEditContent />
    </React.Suspense>
  );
}
