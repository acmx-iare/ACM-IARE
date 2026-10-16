const { neon } = require('@neondatabase/serverless');

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if present
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

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not configured in .env.local');
  process.exit(1);
}

const sql = neon(connectionString);

async function initNeon() {
  console.log('Connecting to Neon PostgreSQL...');

  // 1. Check version & database
  const info = await sql`SELECT version(), current_database(), now()`;
  console.log('Connected to Neon successfully!');
  console.log('Database Info:', info[0]);

  // 2. Create chapter_events table
  await sql`
    CREATE TABLE IF NOT EXISTS chapter_events (
      id VARCHAR(100) PRIMARY KEY,
      slug VARCHAR(200),
      title TEXT NOT NULL,
      tagline TEXT,
      category VARCHAR(50),
      status VARCHAR(50),
      date VARCHAR(50),
      time VARCHAR(100),
      venue TEXT,
      mode VARCHAR(50),
      description TEXT,
      detailed_overview JSONB,
      prerequisites JSONB,
      takeaways JSONB,
      speakers JSONB,
      registration_deadline VARCHAR(50),
      registration_open BOOLEAN DEFAULT true,
      registration_url TEXT,
      google_form_id VARCHAR(150),
      google_form_url TEXT,
      google_form_edit_url TEXT,
      form_status VARCHAR(50) DEFAULT 'active',
      form_config JSONB,
      response_count INT DEFAULT 0,
      banner_image TEXT,
      capacity INT DEFAULT 100,
      featured BOOLEAN DEFAULT false,
      is_archived BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Table chapter_events initialized.');

  // 3. Create event_registrations table
  await sql`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id VARCHAR(100) PRIMARY KEY,
      event_id VARCHAR(100),
      event_title TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      roll_number VARCHAR(50),
      department VARCHAR(100),
      year_of_study VARCHAR(50),
      phone VARCHAR(50),
      acm_id VARCHAR(50),
      answers JSONB,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Table event_registrations initialized.');

  // 4. Create audit_logs table
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      event_id VARCHAR(100),
      status VARCHAR(50),
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ Table audit_logs initialized.');

  // 5. Query all tables
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('Current tables in Neon database:', tables.map(t => t.table_name));

  // 6. Test write and read
  await sql`
    INSERT INTO audit_logs (action, event_id, status, error_message)
    VALUES ('neon_setup_verification', 'system', 'success', 'End-to-end test of Neon Postgres integration')
  `;
  const recentLogs = await sql`
    SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1
  `;
  console.log('Verified write/read test row from Neon audit_logs:', recentLogs[0]);
}

initNeon().catch(err => {
  console.error('Neon initialization error:', err);
  process.exit(1);
});
