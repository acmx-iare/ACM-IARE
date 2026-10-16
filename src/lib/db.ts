import { neon } from "@neondatabase/serverless";
import { ChapterEvent, EventRegistration } from "@/types";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

if (!connectionString && process.env.NODE_ENV === "production") {
  console.error("CRITICAL: DATABASE_URL is not configured in production environment!");
}

export const sql = neon(connectionString);

/**
 * Health check for Neon PostgreSQL connection
 */
export async function getDatabaseHealth() {
  const start = Date.now();
  try {
    const rows = await sql`
      SELECT 
        version(),
        current_database() AS database,
        now() AS timestamp
    `;
    const latencyMs = Date.now() - start;
    const countEvents = await sql`SELECT count(*) FROM chapter_events`;
    const countRegs = await sql`SELECT count(*) FROM event_registrations`;

    return {
      connected: true,
      latencyMs,
      database: rows[0]?.database,
      version: rows[0]?.version,
      timestamp: rows[0]?.timestamp,
      counts: {
        events: Number(countEvents[0]?.count || 0),
        registrations: Number(countRegs[0]?.count || 0),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: message,
    };
  }
}

/**
 * Saves or updates an event in Neon PostgreSQL
 */
export async function syncEventToNeon(event: ChapterEvent): Promise<void> {
  try {
    await sql`
      INSERT INTO chapter_events (
        id, slug, title, tagline, category, status, date, time, venue, mode,
        description, detailed_overview, prerequisites, takeaways, speakers,
        registration_deadline, registration_open, registration_url, google_form_id,
        google_form_url, google_form_edit_url, form_status, form_config,
        response_count, banner_image, capacity, featured, is_archived, updated_at
      ) VALUES (
        ${event.id},
        ${event.slug},
        ${event.title},
        ${event.tagline || ""},
        ${event.category},
        ${event.status},
        ${event.date},
        ${event.time},
        ${event.venue},
        ${event.mode},
        ${event.description},
        ${JSON.stringify(event.detailedOverview || [])},
        ${JSON.stringify(event.prerequisites || [])},
        ${JSON.stringify(event.takeaways || [])},
        ${JSON.stringify(event.speakers || [])},
        ${event.registrationDeadline},
        ${Boolean(event.registrationOpen)},
        ${event.registrationUrl},
        ${event.googleFormId || ""},
        ${event.googleFormUrl || ""},
        ${event.googleFormEditUrl || ""},
        ${event.formStatus || "active"},
        ${JSON.stringify(event.formConfig || null)},
        ${event.responseCount || 0},
        ${event.bannerImage || ""},
        ${event.capacity || 100},
        ${Boolean(event.featured)},
        ${Boolean(event.isArchived)},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        tagline = EXCLUDED.tagline,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        venue = EXCLUDED.venue,
        mode = EXCLUDED.mode,
        description = EXCLUDED.description,
        detailed_overview = EXCLUDED.detailed_overview,
        prerequisites = EXCLUDED.prerequisites,
        takeaways = EXCLUDED.takeaways,
        speakers = EXCLUDED.speakers,
        registration_deadline = EXCLUDED.registration_deadline,
        registration_open = EXCLUDED.registration_open,
        registration_url = EXCLUDED.registration_url,
        google_form_id = EXCLUDED.google_form_id,
        google_form_url = EXCLUDED.google_form_url,
        google_form_edit_url = EXCLUDED.google_form_edit_url,
        form_status = EXCLUDED.form_status,
        form_config = EXCLUDED.form_config,
        response_count = EXCLUDED.response_count,
        banner_image = EXCLUDED.banner_image,
        capacity = EXCLUDED.capacity,
        featured = EXCLUDED.featured,
        is_archived = EXCLUDED.is_archived,
        updated_at = NOW();
    `;
  } catch (err) {
    console.warn("Neon syncEventToNeon notice:", err);
  }
}

/**
 * Saves a registration entry in Neon PostgreSQL
 */
export async function syncRegistrationToNeon(reg: EventRegistration): Promise<void> {
  try {
    await sql`
      INSERT INTO event_registrations (
        id, event_id, event_title, full_name, email, roll_number,
        department, year_of_study, phone, acm_id, submitted_at
      ) VALUES (
        ${reg.id},
        ${reg.eventId},
        ${reg.eventTitle},
        ${reg.fullName},
        ${reg.email},
        ${reg.rollNumber},
        ${reg.department},
        ${reg.yearOfStudy},
        ${reg.phone},
        ${reg.acmId || null},
        ${reg.submittedAt || "NOW()"}
      )
      ON CONFLICT (id) DO UPDATE SET
        event_title = EXCLUDED.event_title,
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        roll_number = EXCLUDED.roll_number,
        department = EXCLUDED.department,
        year_of_study = EXCLUDED.year_of_study,
        phone = EXCLUDED.phone,
        acm_id = EXCLUDED.acm_id;
    `;
  } catch (err) {
    console.warn("Neon syncRegistrationToNeon notice:", err);
  }
}
