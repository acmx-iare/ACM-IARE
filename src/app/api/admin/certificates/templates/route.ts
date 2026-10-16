import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

/**
 * GET /api/admin/certificates/templates
 * Retrieves all certificate templates from Neon
 */
export async function GET() {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await sql`
      SELECT 
        id, name, description, type, title, subtitle, body_template,
        issuer_organization, signatories, branding, layout, is_active,
        created_at, updated_at
      FROM certificate_templates
      ORDER BY created_at ASC;
    `;

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        type: t.type,
        title: t.title,
        subtitle: t.subtitle,
        bodyTemplate: t.body_template,
        issuerOrganization: t.issuer_organization,
        signatories: t.signatories || [],
        branding: t.branding || {},
        layout: t.layout || {},
        isActive: t.is_active,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    });
  } catch (err: unknown) {
    console.error("Fetch templates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch certificate templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/certificates/templates
 * Creates or updates a certificate template
 */
export async function POST(request: NextRequest) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id = `tmpl_${Date.now()}`,
      name,
      description,
      type = "participation",
      title,
      subtitle,
      bodyTemplate,
      issuerOrganization,
      signatories = [],
      branding = {},
      layout = { orientation: "landscape" },
    } = body;

    if (!name || !title || !bodyTemplate) {
      return NextResponse.json(
        { error: "Name, title, and body template are required." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO certificate_templates (
        id, name, description, type, title, subtitle, body_template,
        issuer_organization, signatories, branding, layout, is_active, updated_at
      ) VALUES (
        ${id},
        ${name},
        ${description || ""},
        ${type},
        ${title},
        ${subtitle || ""},
        ${bodyTemplate},
        ${issuerOrganization || "ACM Student Chapter, Institute of Aeronautical Engineering"},
        ${JSON.stringify(signatories)}::jsonb,
        ${JSON.stringify(branding)}::jsonb,
        ${JSON.stringify(layout)}::jsonb,
        true,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        body_template = EXCLUDED.body_template,
        issuer_organization = EXCLUDED.issuer_organization,
        signatories = EXCLUDED.signatories,
        branding = EXCLUDED.branding,
        layout = EXCLUDED.layout,
        updated_at = NOW();
    `;

    return NextResponse.json({
      success: true,
      message: "Template saved successfully",
      id,
    });
  } catch (err: unknown) {
    console.error("Save template error:", err);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}
