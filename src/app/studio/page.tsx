import React from "react";
import Link from "next/link";
import {
  FileText,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  History,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { getAllCmsPages, listCmsMedia } from "@/lib/cms-store";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Website Studio Dashboard | ACM IARE",
};

export default function StudioDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading Website Studio CMS...
        </div>
      }
    >
      <StudioDashboardContent />
    </React.Suspense>
  );
}

async function StudioDashboardContent() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    redirect("/admin/login?next=/studio");
  }

  const pages = await getAllCmsPages();
  const mediaItems = await listCmsMedia();

  const totalPages = pages.length;
  const modifiedPages = pages.filter((p) => p.status === "modified").length;
  const publishedPages = pages.filter((p) => p.status === "published").length;

  const pageSlugToRoute: Record<string, string> = {
    home: "/",
    about: "/about",
    team: "/team",
    gallery: "/gallery",
    contact: "/contact",
    global: "/",
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Website Content Management
          </div>
          <h1 className="text-2xl font-extrabold text-[#14213d] tracking-tight">
            Website Studio CMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author, edit, preview, and publish non-event public website content with complete revision tracking and Cloudflare R2 media storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/studio/media"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
            Media Manager
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-[#14213d] text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Events Console
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Manageable Pages
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalPages}</div>
          <p className="text-[11px] text-slate-400 mt-1">Structured website content models</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Published Live
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{publishedPages}</div>
          <p className="text-[11px] text-slate-400 mt-1">Serving active published revisions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Drafts Pending
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{modifiedPages}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unpublished changes in draft</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              R2 Media Assets
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{mediaItems.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Cloudflare R2 indexed files</p>
        </div>
      </div>

      {/* Pages Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Website Content Sections</h2>
            <p className="text-xs text-slate-500">
              Select any section to modify copy, headings, team profiles, gallery entries, and contact info.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <th className="px-6 py-3">Page / Section</th>
                <th className="px-6 py-3">Route</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Revision</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pages.map((p) => {
                const route = pageSlugToRoute[p.slug] || `/${p.slug}`;
                const isModified = p.status === "modified";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <span>{p.title}</span>
                          <span className="block text-[11px] font-normal text-slate-400 font-mono">
                            slug: {p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                      {route}
                    </td>

                    <td className="px-6 py-4">
                      {isModified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Draft Modified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Published
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        rev #{p.current_revision || 1}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-[11px]">
                      <div>
                        {p.updated_at
                          ? new Date(p.updated_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Default seeded"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        by {p.updated_by || p.published_by || "system"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/studio/edit/${p.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-xs"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Content
                        </Link>

                        <Link
                          href={route}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="View live public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture & Protection Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Event &amp; Content Boundary Protection
        </div>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          The Website Studio CMS strictly controls non-event public copy, team rosters, and media archives. 
          All event registrations, Google Forms, Sheets, attendance tracking, and certificate issuance remain 
          exclusively safeguarded under the <strong>Event Admin Console (/admin)</strong> and cannot be altered or overwritten by CMS actions.
        </p>
      </div>
    </div>
  );
}
