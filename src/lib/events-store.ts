import fs from "fs";
import path from "path";
import { ChapterEvent, EventRegistration, FormQuestion } from "@/types";
import { CHAPTER_EVENTS } from "@/data/chapter";
import { callAppsScript } from "@/lib/google-apps-script";

const DYNAMIC_EVENTS_FILE = path.join(process.cwd(), "src", "data", "dynamic-events.json");
const REGISTRATIONS_FILE = path.join(process.cwd(), "src", "data", "registrations.json");
const DELETED_EVENTS_FILE = path.join(process.cwd(), "src", "data", "deleted-event-ids.json");

// Helper to read deleted event IDs
function readDeletedEventIds(): string[] {
  try {
    if (fs.existsSync(DELETED_EVENTS_FILE)) {
      const data = fs.readFileSync(DELETED_EVENTS_FILE, "utf-8");
      return JSON.parse(data) as string[];
    }
  } catch (err) {
    console.error("Error reading deleted event ids:", err);
  }
  return [];
}

// Helper to write deleted event IDs
function writeDeletedEventIds(ids: string[]) {
  try {
    fs.writeFileSync(DELETED_EVENTS_FILE, JSON.stringify(ids, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving deleted event ids:", err);
  }
}

// Helper to read dynamic events from local JSON file
function readDynamicEvents(): ChapterEvent[] {
  try {
    if (fs.existsSync(DYNAMIC_EVENTS_FILE)) {
      const data = fs.readFileSync(DYNAMIC_EVENTS_FILE, "utf-8");
      return JSON.parse(data) as ChapterEvent[];
    }
  } catch (err) {
    console.error("Error reading dynamic events:", err);
  }
  return [];
}

// Helper to write dynamic events to local JSON file
function writeDynamicEvents(events: ChapterEvent[]) {
  try {
    fs.writeFileSync(DYNAMIC_EVENTS_FILE, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving dynamic events:", err);
  }
}

// Helper to read registrations from local JSON file
function readRegistrations(): EventRegistration[] {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const data = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
      return JSON.parse(data) as EventRegistration[];
    }
  } catch (err) {
    console.error("Error reading registrations:", err);
  }
  return [];
}

// Helper to write registrations
function writeRegistrations(regs: EventRegistration[]) {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(regs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing registrations:", err);
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Returns all events (base chapter events + dynamically created events).
 * Synchronizes with Google Sheets if configured.
 */
export async function getAllEvents(includeArchived = false): Promise<ChapterEvent[]> {
  const deletedIds = new Set(readDeletedEventIds());

  // If Google Apps Script is configured, fetch latest events
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const result = await callAppsScript<ChapterEvent[]>("get_events");
      if (result.success && Array.isArray(result.events)) {
        // Merge or update local dynamic events with GAS records, excluding deleted events
        const gasEvents = (result.events as ChapterEvent[]).filter((e) => !deletedIds.has(e.id));
        writeDynamicEvents(gasEvents);
      }
    } catch (e) {
      console.warn("Could not sync with Google Apps Script, using local cache:", e);
    }
  }

  // Combine base events and dynamic events (avoiding ID collisions and deleted IDs)
  const dynamicMap = new Map(
    readDynamicEvents()
      .filter((e) => !deletedIds.has(e.id))
      .map((e) => [e.id, e])
  );
  const combined: ChapterEvent[] = [];

  // Add base events (unless overridden or deleted)
  for (const baseEvent of CHAPTER_EVENTS) {
    if (deletedIds.has(baseEvent.id)) continue;

    if (dynamicMap.has(baseEvent.id)) {
      combined.push(dynamicMap.get(baseEvent.id)!);
      dynamicMap.delete(baseEvent.id);
    } else {
      combined.push(baseEvent);
    }
  }

  // Add remaining dynamic events
  for (const dynamicEvent of dynamicMap.values()) {
    if (!deletedIds.has(dynamicEvent.id)) {
      combined.push(dynamicEvent);
    }
  }

  if (!includeArchived) {
    return combined.filter((e) => !e.isArchived);
  }

  return combined;
}

/**
 * Finds an event by slug
 */
export async function getEventBySlug(slug: string): Promise<ChapterEvent | undefined> {
  const events = await getAllEvents(false);
  return events.find((e) => e.slug === slug);
}

/**
 * Finds an event by ID
 */
export async function getEventById(id: string): Promise<ChapterEvent | undefined> {
  const events = await getAllEvents(true);
  return events.find((e) => e.id === id);
}

/**
 * Creates a new event with automated Google Form generation.
 * Idempotent: checks for existing event with same title/slug.
 */
export async function createEvent(
  eventInput: Partial<ChapterEvent> & {
    title: string;
    description: string;
    registrationQuestions?: FormQuestion[];
    simulateFailure?: boolean;
  }
): Promise<{ success: boolean; event?: ChapterEvent; message?: string; error?: string; formError?: string }> {
  const existingEvents = await getAllEvents(true);
  const slug = eventInput.slug ? slugify(eventInput.slug) : slugify(eventInput.title);

  // 1. Idempotency Check: if event already exists by slug or title, return it
  const duplicate = existingEvents.find(
    (e) => e.slug === slug || e.title.toLowerCase().trim() === eventInput.title.toLowerCase().trim()
  );
  if (duplicate) {
    return {
      success: true,
      event: duplicate,
      message: "Event already exists. Returned existing event without creating duplicate.",
    };
  }

  const eventId = eventInput.id || `evt_iare_${Date.now()}`;

  // 2. Google Apps Script Integration
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return {
      success: false,
      error:
        "GOOGLE_APPS_SCRIPT_URL is not configured in .env.local. Please deploy the Google Apps Script Web App and paste its URL into .env.local to generate real Google Forms.",
    };
  }

  try {
    const gasResult = await callAppsScript<{
      event: ChapterEvent;
      formUrl?: string;
      formId?: string;
      formEditUrl?: string;
      formStatus?: string;
      formError?: string;
    }>("create_event", {
      id: eventId,
      slug,
      ...eventInput,
    });

    if (gasResult.success && gasResult.event) {
      const gasEvent = gasResult.event as ChapterEvent;
      // Save real event to local dynamic events cache
      const dynamicList = readDynamicEvents();
      dynamicList.push(gasEvent);
      writeDynamicEvents(dynamicList);
      return {
        success: true,
        event: gasEvent,
        message: "Event created and real Google Form provisioned in your Google account successfully.",
      };
    } else {
      return {
        success: false,
        error:
          gasResult.error ||
          "Google Apps Script failed to create the Google Form. Please check your script deployment permissions.",
      };
    }
  } catch (gasErr: unknown) {
    const msg = gasErr instanceof Error ? gasErr.message : String(gasErr);
    return {
      success: false,
      error: `Failed to connect to Google Apps Script: ${msg}`,
    };
  }
}

/**
 * Updates an existing event and synchronizes its Google Form properties
 */
export async function updateEvent(
  id: string,
  updates: Partial<ChapterEvent>
): Promise<{ success: boolean; event?: ChapterEvent; error?: string }> {
  const dynamicList = readDynamicEvents();
  const index = dynamicList.findIndex((e) => e.id === id);

  if (index === -1) {
    // Check if it's one of the base CHAPTER_EVENTS; if so, copy it into dynamic list for editing
    const base = CHAPTER_EVENTS.find((e) => e.id === id);
    if (!base) {
      return { success: false, error: "Event not found" };
    }
    const cloned = { ...base, ...updates, updatedAt: new Date().toISOString() };
    dynamicList.push(cloned);
    writeDynamicEvents(dynamicList);
    return { success: true, event: cloned };
  }

  const existing = dynamicList[index];
  const updated: ChapterEvent = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  dynamicList[index] = updated;
  writeDynamicEvents(dynamicList);

  // Sync with Google Apps Script if available
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const res = await callAppsScript("update_event", updated as unknown as Record<string, unknown>);
      if (!res.success) {
        console.warn("GAS update notice:", res.error);
      }
    } catch (err) {
      console.warn("GAS update sync error:", err);
    }
  }

  return { success: true, event: updated };
}

/**
 * Toggles registration (closes or reopens) on both the Google Form and the website
 */
export async function toggleRegistration(
  id: string,
  open: boolean
): Promise<{ success: boolean; event?: ChapterEvent; error?: string }> {
  const dynamicList = readDynamicEvents();
  let event = dynamicList.find((e) => e.id === id);

  if (!event) {
    const base = CHAPTER_EVENTS.find((e) => e.id === id);
    if (!base) {
      return { success: false, error: "Event not found" };
    }
    event = { ...base };
    dynamicList.push(event);
  }

  event.registrationOpen = open;
  event.status = open ? "upcoming" : "registration_closed";
  event.formStatus = open ? "active" : "closed";
  event.updatedAt = new Date().toISOString();

  writeDynamicEvents(dynamicList);

  // Trigger Google Apps Script toggle if connected
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript("toggle_registration", { id, open });
  }

  return { success: true, event };
}

/**
 * Retries Google Form creation for an event where initial form generation failed
 */
export async function retryFormCreation(
  id: string
): Promise<{ success: boolean; event?: ChapterEvent; error?: string }> {
  const dynamicList = readDynamicEvents();
  const event = dynamicList.find((e) => e.id === id);

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // If GAS is available, call retry
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    const res = await callAppsScript<{ formId: string; formUrl: string }>("retry_form_creation", { id });
    if (res.success && res.formUrl) {
      event.googleFormId = (res.formId as string) || undefined;
      event.googleFormUrl = res.formUrl as string;
      event.registrationUrl = res.formUrl as string;
      event.formStatus = "active";
      event.formCreationError = undefined;
      event.updatedAt = new Date().toISOString();
      writeDynamicEvents(dynamicList);
      return { success: true, event };
    } else {
      return { success: false, error: res.error || "Retry failed on Google Apps Script." };
    }
  }

  return {
    success: false,
    error: "GOOGLE_APPS_SCRIPT_URL is not configured in .env.local. Please configure your Apps Script URL.",
  };
}

/**
 * Archives an event, keeping historical registrations safe
 */
export async function archiveEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const dynamicList = readDynamicEvents();
  const event = dynamicList.find((e) => e.id === id);

  if (event) {
    event.isArchived = true;
    event.registrationOpen = false;
    event.status = "past";
    event.updatedAt = new Date().toISOString();
    writeDynamicEvents(dynamicList);
  }

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    await callAppsScript("archive_event", { id });
  }

  return { success: true };
}

/**
 * Permanently deletes an event, deactivates its Google Form, and removes associated records
 */
export async function deleteEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Remove from dynamic events list
  const dynamicList = readDynamicEvents().filter((e) => e.id !== id);
  writeDynamicEvents(dynamicList);

  // 2. Track in deleted event IDs so it does not reappear
  const deletedIds = readDeletedEventIds();
  if (!deletedIds.includes(id)) {
    deletedIds.push(id);
    writeDeletedEventIds(deletedIds);
  }

  // 3. Clean up any local registrations for this event
  const localRegs = readRegistrations().filter((r) => r.eventId !== id);
  writeRegistrations(localRegs);

  // 4. Synchronize deletion with Google Apps Script & Google Sheets
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const res = await callAppsScript<{ message?: string }>("delete_event", { id });
      if (!res.success) {
        console.warn("GAS delete notice:", res.error);
      }
    } catch (gasErr) {
      console.warn("GAS delete failed:", gasErr);
    }
  }

  return { success: true };
}

/**
 * Retrieves registrations, optionally filtered by event ID
 */
export async function getRegistrations(eventId?: string): Promise<EventRegistration[]> {
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const res = await callAppsScript<Record<string, unknown>[]>("get_registrations", { eventId });
      if (res.success && Array.isArray(res.registrations)) {
        const events = await getAllEvents(true);
        const eventMap = new Map<string, string>(events.map((e) => [e.id, e.title]));

        return (res.registrations as Record<string, unknown>[]).map((raw, idx): EventRegistration => {
          const answers = (typeof raw.answers === "object" && raw.answers !== null ? raw.answers : {}) as Record<string, unknown>;

          // Smart field finder from answers dictionary
          const findVal = (keywords: string[]): string => {
            for (const key of Object.keys(answers)) {
              const lower = key.toLowerCase();
              if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
                const val = answers[key];
                return Array.isArray(val) ? val.join(", ") : String(val ?? "");
              }
            }
            return "";
          };

          const fullName =
            String(raw.fullName || raw.attendeeName || "") ||
            findVal(["full name", "student name", "name", "leader name"]) ||
            "Registered Student";

          const rollNumber =
            String(raw.rollNumber || "") ||
            findVal(["roll", "hall ticket", "ht no", "student id", "id number"]) ||
            "—";

          const department =
            String(raw.department || "") ||
            findVal(["department", "branch", "dept", "stream"]) ||
            "—";

          const yearOfStudy =
            String(raw.yearOfStudy || "") ||
            findVal(["year of study", "year", "current year"]) ||
            "—";

          const phone =
            String(raw.phone || "") ||
            findVal(["phone", "mobile", "whatsapp", "contact"]) ||
            "—";

          const email =
            String(raw.email || "") ||
            findVal(["email", "mail"]) ||
            "—";

          const acmId =
            (raw.acmId as string | undefined) ||
            findVal(["acm id", "acm membership", "membership id"]) ||
            undefined;

          const rawEventId = String(raw.eventId || "");
          const eventTitle =
            String(raw.eventTitle || "") ||
            eventMap.get(rawEventId) ||
            "ACM IARE Event";

          return {
            id: String(raw.id || raw.registrationId || `reg_${idx + 1}`),
            eventId: rawEventId || "general",
            eventTitle,
            fullName,
            email,
            rollNumber,
            department,
            yearOfStudy,
            phone,
            acmId,
            submittedAt: String(raw.submittedAt || new Date().toISOString()),
          };
        });
      }
    } catch (e) {
      console.warn("GAS get_registrations fallback to local:", e);
    }
  }

  const localRegs = readRegistrations();
  if (eventId) {
    return localRegs.filter((r) => r.eventId === eventId);
  }
  return localRegs;
}

/**
 * Records a new registration (from website modal or form submission)
 */
export async function addRegistration(
  regData: Omit<EventRegistration, "id" | "submittedAt">
): Promise<EventRegistration> {
  const allRegs = readRegistrations();
  const newReg: EventRegistration = {
    ...regData,
    id: `reg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    submittedAt: new Date().toISOString(),
  };

  allRegs.unshift(newReg);
  writeRegistrations(allRegs);

  // Increment response count on corresponding dynamic event
  const dynamicList = readDynamicEvents();
  const event = dynamicList.find((e) => e.id === regData.eventId);
  if (event) {
    event.responseCount = (event.responseCount || 0) + 1;
    writeDynamicEvents(dynamicList);
  }

  return newReg;
}
