const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("Seeding events and CMS pages into Neon PostgreSQL...");

  // 1. Seed chapter_events from src/data/chapter.ts if count is 0
  const eventRows = await sql`SELECT count(*) FROM chapter_events;`;
  if (Number(eventRows[0]?.count || 0) === 0) {
    console.log("Seeding base events from chapter.ts...");
    const sampleEvents = [
      {
        id: "evt-01",
        slug: "iar-code-sprint-2026",
        title: "IARE CodeSprint: 12-Hour Algorithmic Hackathon",
        tagline: "Collaborative systems engineering and rapid algorithmic prototyping for campus solutions.",
        category: "Hackathon",
        status: "upcoming",
        date: "2026-11-14",
        time: "08:30 AM – 08:30 PM IST",
        venue: "Central Computing Centre (Lab 1 & 2), Block IV, IARE Campus",
        mode: "In-Person",
        description: "Join 40 student teams in a competitive 12-hour build sprint addressing real collegiate operations.",
        banner_image: "/images/events/hackathon.svg",
        capacity: 160,
        featured: true,
      },
      {
        id: "evt-02",
        slug: "acm-ai-ml-symposium-2026",
        title: "Frontiers in Foundation Models & Transformer Architecture",
        tagline: "A deep academic dive into attention mechanisms, quantization, and LLM fine-tuning.",
        category: "Workshop",
        status: "upcoming",
        date: "2026-11-28",
        time: "10:00 AM – 04:30 PM IST",
        venue: "Auditorium, Academic Block I, IARE",
        mode: "Hybrid",
        description: "A comprehensive masterclass presented by ACM IARE Special Interest Group on Artificial Intelligence.",
        banner_image: "/images/events/ai-ml.svg",
        capacity: 200,
        featured: true,
      },
      {
        id: "evt-03",
        slug: "linux-kernel-and-systems-programming",
        title: "Hands-on Linux Internals, Syscalls & Container Runtimes",
        tagline: "Demystifying eBPF, namespaces, cgroups, and high-performance socket programming in C & Go.",
        category: "Tech Talk",
        status: "upcoming",
        date: "2026-11-05",
        time: "02:00 PM – 05:00 PM IST",
        venue: "CSE Seminar Hall, Block IV",
        mode: "In-Person",
        description: "Explore the internal architecture of Unix-like operating systems with real code traces.",
        banner_image: "/images/events/linux.svg",
        capacity: 150,
        featured: false,
      },
    ];

    for (const e of sampleEvents) {
      await sql`
        INSERT INTO chapter_events (
          id, slug, title, tagline, category, status, date, time, venue, mode,
          description, detailed_overview, prerequisites, takeaways, speakers,
          registration_deadline, registration_open, banner_image, capacity, featured, is_archived, updated_at
        ) VALUES (
          ${e.id}, ${e.slug}, ${e.title}, ${e.tagline}, ${e.category}, ${e.status},
          ${e.date}, ${e.time}, ${e.venue}, ${e.mode}, ${e.description},
          '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
          '2026-11-10', true, ${e.banner_image}, ${e.capacity}, ${e.featured}, false, NOW()
        )
        ON CONFLICT (id) DO NOTHING;
      `;
    }
    console.log("✓ Base chapter events seeded into Neon PostgreSQL");
  } else {
    console.log(`✓ chapter_events already populated (${eventRows[0].count} events)`);
  }

  // 2. Ensure all 6 CMS pages exist: home, about, team, gallery, contact, global
  const targetPages = [
    { id: "page_home", slug: "home", title: "Home Page" },
    { id: "page_about", slug: "about", title: "About the Chapter" },
    { id: "page_team", slug: "team", title: "Chapter Team & Leadership" },
    { id: "page_gallery", slug: "gallery", title: "Gallery & Achievements" },
    { id: "page_contact", slug: "contact", title: "Contact & Membership" },
    { id: "page_global", slug: "global", title: "Navigation & Footer" },
  ];

  for (const p of targetPages) {
    await sql`
      INSERT INTO cms_pages (
        id, title, slug, status, current_revision, published_at, published_by, updated_at, updated_by
      ) VALUES (
        ${p.id}, ${p.title}, ${p.slug}, 'published', 1, NOW(), 'system', NOW(), 'system'
      )
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;
    `;
  }
  console.log("✓ All 6 CMS pages verified in cms_pages table");
}

seed().catch(console.error);
