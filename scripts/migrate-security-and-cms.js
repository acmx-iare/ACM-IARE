const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function runMigration() {
  console.log("=========================================================");
  console.log("Running Neon PostgreSQL Migration: Security & Studio CMS");
  console.log("=========================================================\n");

  const sql = neon(process.env.DATABASE_URL);

  // 1. admin_users
  console.log("1. Creating admin_users table...");
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(100) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin',
      full_name VARCHAR(200),
      is_active BOOLEAN DEFAULT true,
      last_login_at TIMESTAMPTZ,
      password_changed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_email ON admin_users(LOWER(email));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(LOWER(username));`;
  console.log("✓ admin_users table & indexes verified");

  // 2. Seed initial administrator if none exists
  const existingAdmin = await sql`SELECT count(*) FROM admin_users WHERE email = 'acmiare@gmail.com' OR username = 'admin'`;
  if (Number(existingAdmin[0]?.count || 0) === 0) {
    const defaultPassword = process.env.ADMIN_PASSWORD || "acmiare2026admin";
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    const adminId = `usr_${Date.now()}_admin`;

    await sql`
      INSERT INTO admin_users (
        id, username, email, password_hash, role, full_name, is_active, password_changed_at
      ) VALUES (
        ${adminId},
        'admin',
        'acmiare@gmail.com',
        ${passwordHash},
        'super_admin',
        'ACM Chapter Administrator',
        true,
        NOW()
      );
    `;
    console.log("✓ Seeded primary administrator (acmiare@gmail.com / admin) with bcrypt password hash");
  }

  // 3. password_reset_tokens
  console.log("\n2. Creating password_reset_tokens table...");
  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) REFERENCES admin_users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      ip_address VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token_hash);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens(LOWER(email));`;
  console.log("✓ password_reset_tokens table & indexes verified");

  // 4. admin_sessions
  console.log("\n3. Creating admin_sessions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id VARCHAR(100) PRIMARY KEY,
      user_id VARCHAR(100) REFERENCES admin_users(id) ON DELETE CASCADE,
      session_token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_session_token ON admin_sessions(session_token_hash);`;
  console.log("✓ admin_sessions table & indexes verified");

  // 5. cms_pages
  console.log("\n4. Creating cms_pages table...");
  await sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'published',
      published_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      published_at TIMESTAMPTZ,
      published_by VARCHAR(100) DEFAULT 'system',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by VARCHAR(100) DEFAULT 'system'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cms_slug ON cms_pages(slug);`;
  console.log("✓ cms_pages table & indexes verified");

  // 6. cms_revisions
  console.log("\n5. Creating cms_revisions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS cms_revisions (
      id VARCHAR(100) PRIMARY KEY,
      page_id VARCHAR(100) REFERENCES cms_pages(id) ON DELETE CASCADE,
      version INT NOT NULL,
      data JSONB NOT NULL,
      status VARCHAR(50) DEFAULT 'published',
      change_summary TEXT,
      created_by VARCHAR(100) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rev_page ON cms_revisions(page_id, version DESC);`;
  console.log("✓ cms_revisions table & indexes verified");

  // 7. cms_media
  console.log("\n6. Creating cms_media table...");
  await sql`
    CREATE TABLE IF NOT EXISTS cms_media (
      id VARCHAR(100) PRIMARY KEY,
      storage_key TEXT UNIQUE NOT NULL,
      public_url TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INT NOT NULL,
      content_type VARCHAR(100) NOT NULL,
      alt_text TEXT,
      category VARCHAR(50) DEFAULT 'general',
      uploaded_by VARCHAR(100) DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_media_key ON cms_media(storage_key);`;
  console.log("✓ cms_media table & indexes verified");

  // 8. Seed Default CMS Pages Content if table is empty
  const pagesCount = await sql`SELECT count(*) FROM cms_pages`;
  if (Number(pagesCount[0]?.count || 0) === 0) {
    console.log("\n7. Seeding default CMS pages from chapter data...");

    // Home Page Initial Payload
    const homeData = {
      hero: {
        badge: "Official Chapter ID • Established 2018",
        titlePrefix: "Advancing Computing as a Science & Profession at",
        highlightedWord: "IARE",
        description: "The ACM Student Chapter at the Institute of Aeronautical Engineering unites passionate student developers, researchers, and faculty mentors. We foster computer science fundamentals, algorithmic problem solving, open source contributions, and ethical engineering.",
        primaryButtonText: "Explore Events Calendar",
        primaryButtonLink: "/events",
        secondaryButtonText: "Join Chapter",
        secondaryButtonLink: "/contact#join",
      },
      stats: [
        { label: "Collegiate Tech Events", value: "35+", description: "Hands-on workshops, hackathons & expert tech talks hosted." },
        { label: "Active Student Members", value: "320+", description: "Undergraduate engineers across computing branches." },
        { label: "Special Interest Groups", value: "4", description: "AI/ML, Competitive Programming, Systems & Cybersecurity." },
        { label: "ICPC Regional Finalists", value: "12", description: "Student teams qualifying for national & regional contest rounds." }
      ],
      missionPreview: {
        title: "Rigorous Engineering, Open Culture, Ethical Computing",
        description: "Chartered under the global Association for Computing Machinery (ACM), our student chapter functions as the premier technical catalyst at the Institute of Aeronautical Engineering."
      }
    };

    // About Page Initial Payload
    const aboutData = {
      hero: {
        title: "About the ACM Student Chapter",
        tagline: "Dedicated to advancing computing as a science and a profession across the academic ecosystem of IARE Hyderabad."
      },
      narrative: {
        lead: "The ACM Student Chapter at the Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad was founded with a singular conviction: extraordinary software engineers and computer scientists are forged through rigorous fundamentals, shared exploration, and authentic peer mentorship.",
        history: "The Institute of Aeronautical Engineering (IARE), established in 1994, is a premier autonomous engineering college in Hyderabad, accredited with 'A++' Grade by NAAC and affiliated with JNTUH."
      },
      mission: "To cultivate an intellectually rigorous, collaborative computing ecosystem at IARE by facilitating hands-on technical workshops, competitive programming circles, open-source initiatives, and ethical technology discussions aligned with ACM global standards.",
      vision: "To be the premier university computing organization in Telangana, equipping student technologists with theoretical foundations, cutting-edge engineering skills, and professional integrity.",
      academicPillars: [
        { title: "Core CS Fundamentals", description: "Data structures, algorithms, operating systems, and discrete mathematics." },
        { title: "Applied Research & SIGs", description: "Undergraduate exploration in artificial intelligence, distributed systems, and security." },
        { title: "Open Source Leadership", description: "Writing clean, documented, peer-reviewed software for collegiate and public welfare." }
      ]
    };

    // Contact & Membership Initial Payload
    const contactData = {
      hero: {
        title: "Contact & Membership",
        tagline: "Have questions about the ACM Student Chapter or looking to join our community? Connect with our executive council."
      },
      contactInfo: {
        email: "acm@iare.ac.in",
        facultyEmail: "hod-cse@iare.ac.in",
        phone: "+91 040-29705852 / 53 / 54",
        address: "Dundigal Road, Hyderabad, Telangana 500043, India"
      },
      membership: {
        title: "Join the ACM IARE Chapter",
        subtitle: "Open to all enrolled students at IARE passionate about computing.",
        benefits: [
          "Priority registration for hackathons, competitive programming contests, and hands-on clinics.",
          "Membership in our technical Special Interest Groups (SIG-AI, SIG-CP, SIG-SYS, SIG-SEC).",
          "One-on-one mentorship from senior engineers, ICPC regional finalists, and alumni mentors.",
          "ACM accredited participation and achievement certificates."
        ]
      }
    };

    // Footer & Social Links
    const footerData = {
      tagline: "Advancing Computing as a Science & Profession at Institute of Aeronautical Engineering.",
      copyright: "ACM Student Chapter, Institute of Aeronautical Engineering (IARE). All rights reserved.",
      socials: {
        linkedin: "https://www.linkedin.com/company/acm-iare",
        github: "https://github.com/acm-iare",
        instagram: "https://www.instagram.com/acm_iare",
        twitter: "https://twitter.com/acm_iare",
        iareWebsite: "https://www.iare.ac.in",
        acmGlobal: "https://www.acm.org"
      }
    };

    await sql`
      INSERT INTO cms_pages (id, title, slug, description, published_data, draft_data, published_at)
      VALUES 
        ('home', 'Home Page', 'home', 'Main landing page hero, stats, and chapter intro', ${JSON.stringify(homeData)}::jsonb, ${JSON.stringify(homeData)}::jsonb, NOW()),
        ('about', 'About Page', 'about', 'Chapter mission, vision, history, and academic pillars', ${JSON.stringify(aboutData)}::jsonb, ${JSON.stringify(aboutData)}::jsonb, NOW()),
        ('contact', 'Contact & Join Page', 'contact', 'Contact details, address, and membership information', ${JSON.stringify(contactData)}::jsonb, ${JSON.stringify(contactData)}::jsonb, NOW()),
        ('footer', 'Footer & Global Socials', 'footer', 'Social media URLs, campus contact, and copyright notice', ${JSON.stringify(footerData)}::jsonb, ${JSON.stringify(footerData)}::jsonb, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    console.log("✓ Seeded default CMS pages (home, about, contact, footer)");
  }

  // Summary of all tables
  const allTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log("\nAll public tables in Neon database:");
  console.log(allTables.map(t => t.table_name));

  console.log("\n=== Migration completed successfully! ===");
}

runMigration().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
