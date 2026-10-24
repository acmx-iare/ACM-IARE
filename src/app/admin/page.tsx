import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  FileSpreadsheet,
  Users,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  KeyRound,
} from "lucide-react";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getAllEvents, getRegistrations } from "@/lib/events-store";
import { sql } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Admin Dashboard | ACM IARE",
};

export default function AdminDashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading administration metrics...
        </div>
      }
    >
      <AdminDashboardContent />
    </React.Suspense>
  );
}

async function AdminDashboardContent() {
  const isAuth = await isAuthenticatedAdmin();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const events = await getAllEvents(true);
  const registrations = await getRegistrations();

  const totalEvents = events.filter((e) => !e.isArchived).length;
  const formsProvisioned = events.filter((e) => e.googleFormUrl && e.formStatus === "active").length;
  const totalRegistrations = registrations.length;
  const isGasConfigured = Boolean(process.env.GOOGLE_APPS_SCRIPT_URL);

  let certCount = 0;
  try {
    const certRows = await sql`SELECT count(*) FROM issued_certificates WHERE status = 'valid'`;
    certCount = Number(certRows[0]?.count || 0);
  } catch {
    certCount = 0;
  }

  const recentEvents = [...events].reverse().slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Integration Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#14213d] tracking-tight">
            Event Automation &amp; Certificate Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated Google Forms provisioning, Neon PostgreSQL registry, and Cloudflare R2 certificate management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              isGasConfigured
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isGasConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {isGasConfigured ? "Google Apps Script: Live" : "Local Event Store Mode"}
          </div>

          <Button href="/admin/certificates" variant="secondary" size="sm">
            <Award className="w-4 h-4 text-amber-500" />
            Certificates
          </Button>

          <Button href="/admin/events/new" variant="primary" size="sm">
            <PlusCircle className="w-4 h-4" />
            New Event
          </Button>
        </div>
      </div>

      {/* Administrator Credentials Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#14213d] flex items-center gap-2">
              Administrator Credentials
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Primary login password for admin portal, Google Apps Script automation, and CMS operations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
          <span className="text-xs text-slate-500 font-medium">Password:</span>
          <code className="font-mono text-xs font-bold text-blue-700 select-all">
            acmiare2026admin
          </code>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Total Active Events
            </span>
            <span className="text-2xl font-extrabold text-[#14213d] block mt-1">
              {totalEvents}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Published on portal
            </span>
          </div>
          <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Google Forms Created
            </span>
            <span className="text-2xl font-extrabold text-[#14213d] block mt-1">
              {formsProvisioned}
            </span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
              100% automated creation
            </span>
          </div>
          <div className="w-10 h-10 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Total Registrations
            </span>
            <span className="text-2xl font-extrabold text-[#14213d] block mt-1">
              {totalRegistrations}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Neon &amp; Sheets Registry
            </span>
          </div>
          <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase">
              Issued Certificates
            </span>
            <span className="text-2xl font-extrabold text-[#14213d] block mt-1">
              {certCount}
            </span>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">
              Neon &amp; R2 Verified
            </span>
          </div>
          <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Integration Info Banner if GAS not yet configured */}
      {!isGasConfigured && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-900">
          <div className="space-y-1">
            <strong className="font-bold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Running in Development / Local Mode
            </strong>
            <p className="text-amber-800">
              Your events, automated Google Form links, and registrations are stored and tested locally. To link to your live Google Spreadsheet and Google Forms account, follow the setup instructions in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">google-apps-script/README.md</code>.
            </p>
          </div>
          <Button href="/admin/events/new" variant="secondary" size="sm" className="shrink-0">
            Create Test Event
          </Button>
        </div>
      )}

      {/* Recent Events Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#14213d]">Recent Events &amp; Forms</h2>
            <p className="text-xs text-slate-500">
              Every created event automatically generates its own linked Google Form.
            </p>
          </div>
          <Link
            href="/admin/events"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
          >
            <span>View All ({events.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Event Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Google Form</th>
                <th className="px-4 py-3 text-right">Responses</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-900 block truncate max-w-xs" title={event.title}>
                      {event.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {event.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {event.category}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {formatDate(event.date)}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={event.registrationOpen ? "teal" : "past"}>
                      {event.registrationOpen ? "Open" : "Closed"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    {event.googleFormUrl ? (
                      <a
                        href={event.googleFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                      >
                        <span>Open Form</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : event.formStatus === "failed" ? (
                      <span className="text-red-600 font-semibold text-[11px]">
                        Creation Failed
                      </span>
                    ) : (
                      <span className="text-slate-400">Not Created</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    {event.responseCount || 0}
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="text-slate-600 hover:text-blue-600 font-semibold"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/events/${event.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
