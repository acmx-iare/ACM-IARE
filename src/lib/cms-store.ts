import { sql } from "./db";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import {
  CHAPTER_INFO,
  NAVIGATION_LINKS,
  CHAPTER_TEAM,
  GALLERY_ITEMS,
  CHAPTER_ACHIEVEMENTS,
} from "@/data/chapter";

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: "published" | "draft" | "modified";
  draft_content: any;
  published_content: any;
  current_revision: number;
  published_at?: string;
  published_by?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface CmsRevision {
  id: string;
  page_id: string;
  version: number;
  data: any;
  status: string;
  change_summary?: string;
  created_by?: string;
  created_at: string;
}

export interface CmsMediaItem {
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

/**
 * Default fallback contents for each managed page
 */
export const DEFAULT_PAGE_CONTENTS: Record<string, any> = {
  home: {
    hero: {
      badge: "Official Chapter ID • Established 2018",
      titlePrefix: "Advancing Computing as a Science & Profession at",
      highlightedWord: "IARE",
      description:
        "The ACM Student Chapter at the Institute of Aeronautical Engineering unites passionate student developers, researchers, and faculty mentors. We foster computer science fundamentals, algorithmic problem solving, open source contributions, and ethical engineering.",
      primaryButtonText: "Explore Events Calendar",
      primaryButtonLink: "/events",
      secondaryButtonText: "Join Chapter",
      secondaryButtonLink: "/contact#join",
    },
    stats: [
      { label: "Collegiate Tech Events", value: "35+", description: "Hands-on workshops, hackathons & expert tech talks hosted." },
      { label: "Active Student Members", value: "320+", description: "Undergraduate engineers across computing branches." },
      { label: "Special Interest Groups", value: "4", description: "AI/ML, Competitive Programming, Systems & Cybersecurity." },
      { label: "ICPC Regional Finalists", value: "12", description: "Student teams qualifying for national & regional contest rounds." },
    ],
    missionPreview: {
      title: "Rigorous Engineering, Open Culture, Ethical Computing",
      description:
        "Chartered under the global Association for Computing Machinery (ACM), our student chapter functions as the premier technical catalyst at the Institute of Aeronautical Engineering.",
    },
    announcement: {
      enabled: true,
      badge: "Announcements",
      text: "Registration open for upcoming Chapter Hackathons and Technical Workshops.",
      linkText: "View Events &rarr;",
      linkHref: "/events",
    },
  },

  about: {
    hero: {
      title: "About the ACM Student Chapter",
      tagline:
        "Dedicated to advancing computing as a science and a profession across the academic ecosystem of IARE Hyderabad.",
    },
    narrative: {
      lead:
        "The ACM Student Chapter at the Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad was founded with a singular conviction: extraordinary software engineers and computer scientists are forged through rigorous fundamentals, shared exploration, and authentic peer mentorship.",
      history:
        "The Institute of Aeronautical Engineering (IARE), established in 1994, is a premier autonomous engineering college in Hyderabad, accredited with 'A++' Grade by NAAC and affiliated with JNTUH.",
    },
    mission:
      "To cultivate an intellectually rigorous, collaborative computing ecosystem at IARE by facilitating hands-on technical workshops, competitive programming circles, open-source initiatives, and ethical technology discussions aligned with ACM global standards.",
    vision:
      "To be the premier university computing organization in Telangana, equipping student technologists with theoretical foundations, cutting-edge engineering skills, and professional integrity.",
    academicPillars: [
      { title: "Core CS Fundamentals", description: "Data structures, algorithms, operating systems, and discrete mathematics." },
      { title: "Applied Research & SIGs", description: "Undergraduate exploration in artificial intelligence, distributed systems, and security." },
      { title: "Open Source Leadership", description: "Writing clean, documented, peer-reviewed software for collegiate and public welfare." },
    ],
  },

  team: {
    hero: {
      badge: "Leadership & Advisory Council",
      title: "Chapter Team & Office Bearers",
      description:
        "The ACM Student Chapter at IARE is guided by dedicated faculty scholars and operated by democratically elected student officers committed to technical service and academic integrity.",
    },
    members: CHAPTER_TEAM,
  },

  gallery: {
    hero: {
      badge: "Archives & Competitive Milestones",
      title: "Gallery & Verified Achievements",
      description:
        "Photographic archives of campus coding marathons, distinguished speaker colloquiums, and documented honors attained by collegiate student teams.",
    },
    achievements: CHAPTER_ACHIEVEMENTS,
    galleryItems: GALLERY_ITEMS,
  },

  contact: {
    hero: {
      title: "Contact & Membership",
      tagline:
        "Have questions about the ACM Student Chapter or looking to join our community? Connect with our executive council.",
    },
    contactInfo: {
      email: CHAPTER_INFO.contactEmail,
      facultyEmail: CHAPTER_INFO.facultyEmail,
      phone: CHAPTER_INFO.phone,
      address: CHAPTER_INFO.address,
      mapUrl: "https://maps.google.com/?q=Institute+of+Aeronautical+Engineering+Hyderabad",
    },
    membershipInfo: {
      title: "How to Join ACM IARE",
      benefits: [
        "Priority access to hands-on workshops and specialized SIG cohort tracks.",
        "Team matching and coaching for collegiate ICPC, hackathons, and research projects.",
        "Direct networking with alumni working at premier technology organizations.",
        "Mentorship from experienced senior student officers and faculty advisors.",
      ],
    },
  },

  global: {
    navbar: {
      brandTitle: "ACM IARE",
      brandSubtitle: "Student Chapter",
      links: NAVIGATION_LINKS,
    },
    footer: {
      description:
        "The Association for Computing Machinery (ACM) Student Chapter at the Institute of Aeronautical Engineering (Autonomous), Dundigal, Hyderabad.",
      socials: CHAPTER_INFO.socials,
    },
  },
};

/**
 * Ensures all standard CMS pages exist and are populated in Neon PostgreSQL
 */
export async function ensureCmsSeeded(): Promise<void> {
  try {
    const existing = await sql`SELECT slug FROM cms_pages;`;
    const existingSlugs = new Set((existing || []).map((r: any) => r.slug));

    const pageConfigs = [
      { id: "page_home", slug: "home", title: "Home Page" },
      { id: "page_about", slug: "about", title: "About the Chapter" },
      { id: "page_team", slug: "team", title: "Chapter Team & Leadership" },
      { id: "page_gallery", slug: "gallery", title: "Gallery & Achievements" },
      { id: "page_contact", slug: "contact", title: "Contact & Membership" },
      { id: "page_global", slug: "global", title: "Navigation & Footer" },
    ];

    for (const p of pageConfigs) {
      if (!existingSlugs.has(p.slug)) {
        const defaultData = DEFAULT_PAGE_CONTENTS[p.slug] || {};
        await sql`
          INSERT INTO cms_pages (
            id, slug, title, status, draft_content, published_content,
            current_revision, published_at, published_by, updated_at, updated_by
          ) VALUES (
            ${p.id},
            ${p.slug},
            ${p.title},
            'published',
            ${JSON.stringify(defaultData)},
            ${JSON.stringify(defaultData)},
            1,
            NOW(),
            'system',
            NOW(),
            'system'
          )
          ON CONFLICT (slug) DO NOTHING;
        `;

        // Also add initial revision entry
        const revId = `rev_${p.slug}_1`;
        await sql`
          INSERT INTO cms_revisions (
            id, page_id, version, data, status, change_summary, created_by, created_at
          ) VALUES (
            ${revId},
            ${p.id},
            1,
            ${JSON.stringify(defaultData)},
            'published',
            'Initial default version seeded',
            'system',
            NOW()
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
  } catch (err) {
    console.warn("Notice ensuring CMS seeded:", err);
  }
}

/**
 * Fetch all manageable CMS pages
 */
export async function getAllCmsPages(): Promise<CmsPage[]> {
  try {
    await ensureCmsSeeded();
    const rows = await sql`
      SELECT 
        id, slug, title, status, draft_content, published_content,
        current_revision, published_at, published_by, updated_at, updated_by
      FROM cms_pages
      ORDER BY 
        CASE 
          WHEN slug = 'home' THEN 1
          WHEN slug = 'about' THEN 2
          WHEN slug = 'team' THEN 3
          WHEN slug = 'gallery' THEN 4
          WHEN slug = 'contact' THEN 5
          WHEN slug = 'global' THEN 6
          ELSE 7
        END;
    `;
    return (rows as CmsPage[]) || [];
  } catch (err) {
    console.error("getAllCmsPages error:", err);
    return [];
  }
}

/**
 * Fetch a single CMS page by ID or Slug
 */
export async function getCmsPage(idOrSlug: string): Promise<CmsPage | null> {
  try {
    await ensureCmsSeeded();
    const rows = await sql`
      SELECT 
        id, slug, title, status, draft_content, published_content,
        current_revision, published_at, published_by, updated_at, updated_by
      FROM cms_pages
      WHERE id = ${idOrSlug} OR slug = ${idOrSlug}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) return null;
    return rows[0] as CmsPage;
  } catch (err) {
    console.error("getCmsPage error:", err);
    return null;
  }
}

async function fetchPublishedContentRaw(slug: string): Promise<any> {
  const fallback = DEFAULT_PAGE_CONTENTS[slug] || {};
  try {
    const rows = await sql`
      SELECT published_content
      FROM cms_pages
      WHERE slug = ${slug}
      LIMIT 1;
    `;

    if (rows && rows.length > 0 && rows[0].published_content) {
      const published = rows[0].published_content;
      return { ...fallback, ...published };
    }
  } catch (err) {
    console.warn(`CMS published content fallback used for [${slug}]`);
  }
  return fallback;
}

/**
 * Get published content for public website with seamless fallback to static defaults
 */
export async function getCmsPublishedContent<T = any>(slug: string): Promise<T> {
  const getCached = unstable_cache(
    async (s: string) => fetchPublishedContentRaw(s),
    ["cms-published-content"],
    { revalidate: 60, tags: ["cms-content"] }
  );
  return (await getCached(slug)) as T;
}

/**
 * Save draft content for a CMS page
 */
export async function saveCmsDraft(
  pageIdOrSlug: string,
  draftContent: any,
  updatedBy: string = "admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    const page = await getCmsPage(pageIdOrSlug);
    if (!page) {
      return { success: false, error: "CMS Page not found" };
    }

    await sql`
      UPDATE cms_pages
      SET 
        draft_content = ${JSON.stringify(draftContent)},
        status = 'modified',
        updated_at = NOW(),
        updated_by = ${updatedBy}
      WHERE id = ${page.id};
    `;

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("saveCmsDraft error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Publish draft content to live website, increment revision, record snapshot in cms_revisions
 */
export async function publishCmsPage(
  pageIdOrSlug: string,
  publishedBy: string = "admin",
  changeSummary: string = "Content update published via Studio CMS"
): Promise<{ success: boolean; newVersion?: number; error?: string }> {
  try {
    const page = await getCmsPage(pageIdOrSlug);
    if (!page) {
      return { success: false, error: "CMS Page not found" };
    }

    const newRevisionNumber = (page.current_revision || 1) + 1;
    const contentToPublish = page.draft_content || page.published_content;
    const revId = `rev_${page.slug}_${newRevisionNumber}_${Date.now()}`;

    // 1. Update page in cms_pages
    await sql`
      UPDATE cms_pages
      SET 
        published_content = ${JSON.stringify(contentToPublish)},
        current_revision = ${newRevisionNumber},
        status = 'published',
        published_at = NOW(),
        published_by = ${publishedBy},
        updated_at = NOW(),
        updated_by = ${publishedBy}
      WHERE id = ${page.id};
    `;

    // 2. Insert into cms_revisions
    await sql`
      INSERT INTO cms_revisions (
        id, page_id, version, data, status, change_summary, created_by, created_at
      ) VALUES (
        ${revId},
        ${page.id},
        ${newRevisionNumber},
        ${JSON.stringify(contentToPublish)},
        'published',
        ${changeSummary},
        ${publishedBy},
        NOW()
      );
    `;

    // 3. Log to audit_logs
    try {
      await sql`
        INSERT INTO audit_logs (action, event_id, status, error_message)
        VALUES ('cms_page_published', ${page.slug}, 'success', ${`CMS page [${page.title}] revision ${newRevisionNumber} published by ${publishedBy}`});
      `;
    } catch {}

    // 4. Revalidate public routes & cache tags
    try {
      revalidateTag("cms-content", "default");
      if (page.slug === "home") revalidatePath("/");
      else if (page.slug === "global") {
        revalidatePath("/", "layout");
      } else {
        revalidatePath(`/${page.slug}`);
      }
    } catch (e) {
      console.warn("Revalidation notice:", e);
    }

    return { success: true, newVersion: newRevisionNumber };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("publishCmsPage error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Rollback a CMS page to a previous revision
 */
export async function revertCmsPageRevision(
  pageIdOrSlug: string,
  targetVersion: number,
  revertedBy: string = "admin"
): Promise<{ success: boolean; error?: string }> {
  try {
    const page = await getCmsPage(pageIdOrSlug);
    if (!page) {
      return { success: false, error: "CMS Page not found" };
    }

    // Fetch snapshot from cms_revisions
    const revRows = await sql`
      SELECT data, version, change_summary
      FROM cms_revisions
      WHERE page_id = ${page.id} AND version = ${targetVersion}
      LIMIT 1;
    `;

    if (!revRows || revRows.length === 0) {
      return { success: false, error: `Revision ${targetVersion} not found for this page.` };
    }

    const targetSnapshot = revRows[0].data;
    const newVersionNumber = (page.current_revision || 1) + 1;
    const newRevId = `rev_${page.slug}_rollback_v${targetVersion}_${Date.now()}`;
    const summary = `Rolled back to revision ${targetVersion}`;

    // 1. Update cms_pages
    await sql`
      UPDATE cms_pages
      SET 
        published_content = ${JSON.stringify(targetSnapshot)},
        draft_content = ${JSON.stringify(targetSnapshot)},
        current_revision = ${newVersionNumber},
        status = 'published',
        published_at = NOW(),
        published_by = ${revertedBy},
        updated_at = NOW(),
        updated_by = ${revertedBy}
      WHERE id = ${page.id};
    `;

    // 2. Record rollback entry in cms_revisions
    await sql`
      INSERT INTO cms_revisions (
        id, page_id, version, data, status, change_summary, created_by, created_at
      ) VALUES (
        ${newRevId},
        ${page.id},
        ${newVersionNumber},
        ${JSON.stringify(targetSnapshot)},
        'published',
        ${summary},
        ${revertedBy},
        NOW()
      );
    `;

    // 3. Log to audit_logs
    try {
      await sql`
        INSERT INTO audit_logs (action, event_id, status, error_message)
        VALUES ('cms_page_rollback', ${page.slug}, 'success', ${`Rolled back [${page.title}] to revision ${targetVersion} by ${revertedBy}`});
      `;
    } catch {}

    // 4. Revalidate cache
    try {
      revalidateTag("cms-content", "default");
      if (page.slug === "home") revalidatePath("/");
      else if (page.slug === "global") revalidatePath("/", "layout");
      else revalidatePath(`/${page.slug}`);
    } catch {}

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("revertCmsPageRevision error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Fetch all revision history for a CMS page
 */
export async function getCmsPageRevisions(pageIdOrSlug: string): Promise<CmsRevision[]> {
  try {
    const page = await getCmsPage(pageIdOrSlug);
    const targetId = page ? page.id : pageIdOrSlug;
    const rows = await sql`
      SELECT id, page_id, version, data, status, change_summary, created_by, created_at
      FROM cms_revisions
      WHERE page_id = ${targetId} OR page_id = ${pageIdOrSlug}
      ORDER BY version DESC;
    `;
    return (rows as CmsRevision[]) || [];
  } catch (err) {
    console.error("getCmsPageRevisions error:", err);
    return [];
  }
}

/**
 * List all CMS media assets
 */
export async function listCmsMedia(): Promise<CmsMediaItem[]> {
  try {
    const rows = await sql`
      SELECT id, storage_key, public_url, file_name, file_size, content_type, alt_text, category, uploaded_by, created_at
      FROM cms_media
      ORDER BY created_at DESC;
    `;
    return (rows as CmsMediaItem[]) || [];
  } catch (err) {
    console.error("listCmsMedia error:", err);
    return [];
  }
}

/**
 * Add or update CMS media record
 */
export async function recordCmsMedia(media: Omit<CmsMediaItem, "created_at">): Promise<void> {
  try {
    await sql`
      INSERT INTO cms_media (
        id, storage_key, public_url, file_name, file_size, content_type, alt_text, category, uploaded_by, created_at
      ) VALUES (
        ${media.id},
        ${media.storage_key},
        ${media.public_url},
        ${media.file_name},
        ${media.file_size},
        ${media.content_type},
        ${media.alt_text || null},
        ${media.category || "general"},
        ${media.uploaded_by || "admin"},
        NOW()
      )
      ON CONFLICT (storage_key) DO UPDATE SET
        alt_text = EXCLUDED.alt_text,
        file_name = EXCLUDED.file_name;
    `;
  } catch (err) {
    console.error("recordCmsMedia error:", err);
  }
}

/**
 * Delete a media item record
 */
export async function deleteCmsMedia(storageKey: string): Promise<void> {
  try {
    await sql`DELETE FROM cms_media WHERE storage_key = ${storageKey};`;
  } catch (err) {
    console.error("deleteCmsMedia error:", err);
  }
}
