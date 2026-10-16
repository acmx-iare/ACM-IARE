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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    } catch (err: unknown) {
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
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-16 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Back to Studio Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{page.title}</h1>
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
            Preview Draft
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
          <div>
            <p className="font-semibold text-emerald-900">Success</p>
            <p className="text-emerald-700">{successNotice}</p>
          </div>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Notice</p>
            <p className="text-red-700">{errorNotice}</p>
          </div>
        </div>
      )}

      {/* Dynamic Content Form Based on Page Slug */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-8">
        
        {/* ===================== HOME PAGE EDITOR ===================== */}
        {slug === "home" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Hero Section &amp; Main Banners
            </h2>

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Highlighted Word (Yellow Accent)</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Description</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
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
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
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
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
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
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
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
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md"
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
          </div>
        )}

        {/* ===================== ABOUT PAGE EDITOR ===================== */}
        {slug === "about" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              About Chapter Narrative &amp; Mission
            </h2>

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
          </div>
        )}

        {/* ===================== TEAM PAGE EDITOR ===================== */}
        {slug === "team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Leadership, Faculty &amp; Executive Council Members
              </h2>
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
                    bio: "Member biography",
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

            <div className="space-y-4">
              {(formData.members || []).map((member: any, index: number) => (
                <div key={member.id || index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      #{index + 1}: {member.name || "Untitled Member"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.members.filter((_: any, i: number) => i !== index);
                        setFormData({ ...formData, members: updated });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
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
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Profile Image URL</label>
                      <input
                        type="text"
                        value={member.imageUrl || ""}
                        onChange={(e) => {
                          const updated = [...formData.members];
                          updated[index].imageUrl = e.target.value;
                          setFormData({ ...formData, members: updated });
                        }}
                        placeholder="/images/team/... or Cloudflare R2 URL"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                  </div>

                  <div>
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
              ))}
            </div>
          </div>
        )}

        {/* ===================== GALLERY PAGE EDITOR ===================== */}
        {slug === "gallery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Photographic Archives &amp; Achievements
              </h2>
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
                  };
                  setFormData({
                    ...formData,
                    galleryItems: [...(formData.galleryItems || []), newItem],
                  });
                }}
                className="text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Image Entry
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(formData.galleryItems || []).map((item: any, index: number) => (
                <div key={item.id || index} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.galleryItems.filter((_: any, i: number) => i !== index);
                        setFormData({ ...formData, galleryItems: updated });
                      }}
                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Caption / Title</label>
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) => {
                        const updated = [...formData.galleryItems];
                        updated[index].title = e.target.value;
                        setFormData({ ...formData, galleryItems: updated });
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Category</label>
                      <select
                        value={item.category || "Hackathons"}
                        onChange={(e) => {
                          const updated = [...formData.galleryItems];
                          updated[index].category = e.target.value;
                          setFormData({ ...formData, galleryItems: updated });
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Hackathons">Hackathons</option>
                        <option value="Workshops">Workshops</option>
                        <option value="Community">Community</option>
                        <option value="Celebrations">Celebrations</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={item.year || "2026"}
                        onChange={(e) => {
                          const updated = [...formData.galleryItems];
                          updated[index].year = e.target.value;
                          setFormData({ ...formData, galleryItems: updated });
                        }}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Image URL</label>
                    <input
                      type="text"
                      value={item.imageUrl || ""}
                      onChange={(e) => {
                        const updated = [...formData.galleryItems];
                        updated[index].imageUrl = e.target.value;
                        setFormData({ ...formData, galleryItems: updated });
                      }}
                      placeholder="/images/... or Cloudflare R2 URL"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== CONTACT PAGE EDITOR ===================== */}
        {slug === "contact" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Contact Channels, Office Hours &amp; Join Details
            </h2>

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Telephone</label>
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Physical Address</label>
              <input
                type="text"
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
          </div>
        )}

        {/* ===================== GLOBAL / FOOTER EDITOR ===================== */}
        {slug === "global" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Site-Wide Navigation &amp; Social Links
            </h2>

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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
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
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
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

