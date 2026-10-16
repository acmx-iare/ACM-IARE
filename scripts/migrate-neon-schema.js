const fs = require('fs');
const path = require('path');
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
  console.log('Running Neon PostgreSQL Schema Migration...');
  const sql = neon(process.env.DATABASE_URL);

  // 1. chapter_events
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
  await sql`CREATE INDEX IF NOT EXISTS idx_events_slug ON chapter_events(slug);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_date ON chapter_events(date);`;
  console.log('✓ chapter_events table & indexes verified');

  // 2. event_registrations
  await sql`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id VARCHAR(100) PRIMARY KEY,
      event_id VARCHAR(100) REFERENCES chapter_events(id) ON DELETE CASCADE,
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
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_event_id ON event_registrations(event_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_email ON event_registrations(LOWER(email));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reg_roll ON event_registrations(roll_number);`;
  console.log('✓ event_registrations table & indexes verified');

  // 3. event_attendance
  await sql`
    CREATE TABLE IF NOT EXISTS event_attendance (
      id VARCHAR(100) PRIMARY KEY,
      event_id VARCHAR(100) REFERENCES chapter_events(id) ON DELETE CASCADE,
      registration_id VARCHAR(100) REFERENCES event_registrations(id) ON DELETE SET NULL,
      full_name TEXT NOT NULL,
      roll_number VARCHAR(50),
      email VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'present',
      marked_at TIMESTAMPTZ DEFAULT NOW(),
      marked_by VARCHAR(100) DEFAULT 'admin'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_att_event_email ON event_attendance(event_id, LOWER(email));`;
  console.log('✓ event_attendance table & indexes verified');

  // 4. certificate_templates
  await sql`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      type VARCHAR(50) DEFAULT 'participation',
      title TEXT NOT NULL DEFAULT 'Certificate of Participation',
      subtitle TEXT DEFAULT 'This is proudly presented to',
      body_template TEXT NOT NULL,
      issuer_organization TEXT DEFAULT 'ACM Student Chapter, Institute of Aeronautical Engineering (IARE)',
      signatories JSONB DEFAULT '[]'::jsonb,
      branding JSONB DEFAULT '{}'::jsonb,
      layout JSONB DEFAULT '{"orientation": "landscape", "primaryColor": "#00838F", "accentColor": "#14213D"}'::jsonb,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  console.log('✓ certificate_templates table verified');

  // 5. issued_certificates
  await sql`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(100) PRIMARY KEY,
      certificate_number VARCHAR(100) UNIQUE NOT NULL,
      event_id VARCHAR(100) REFERENCES chapter_events(id) ON DELETE SET NULL,
      registration_id VARCHAR(100) REFERENCES event_registrations(id) ON DELETE SET NULL,
      template_id VARCHAR(100) REFERENCES certificate_templates(id) ON DELETE SET NULL,
      recipient_name TEXT NOT NULL,
      recipient_email VARCHAR(255) NOT NULL,
      recipient_roll_number VARCHAR(50),
      recipient_department VARCHAR(100),
      event_title TEXT NOT NULL,
      event_date VARCHAR(50),
      certificate_type VARCHAR(50) DEFAULT 'participation',
      status VARCHAR(50) DEFAULT 'valid',
      revoked_at TIMESTAMPTZ,
      revoked_reason TEXT,
      pdf_storage_key TEXT NOT NULL,
      pdf_file_size INT DEFAULT 0,
      qr_verification_url TEXT NOT NULL,
      issued_at TIMESTAMPTZ DEFAULT NOW(),
      issued_by VARCHAR(100) DEFAULT 'admin'
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_number ON issued_certificates(certificate_number);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_event ON issued_certificates(event_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_email ON issued_certificates(LOWER(recipient_email));`;
  await sql`CREATE INDEX IF NOT EXISTS idx_cert_status ON issued_certificates(status);`;
  console.log('✓ issued_certificates table & indexes verified');

  // 6. file_metadata
  await sql`
    CREATE TABLE IF NOT EXISTS file_metadata (
      id VARCHAR(100) PRIMARY KEY,
      storage_key TEXT UNIQUE NOT NULL,
      bucket VARCHAR(100) NOT NULL,
      file_name TEXT NOT NULL,
      content_type VARCHAR(100) NOT NULL,
      file_size_bytes INT NOT NULL,
      category VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_file_key ON file_metadata(storage_key);`;
  console.log('✓ file_metadata table verified');

  // 7. audit_logs
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
  console.log('✓ audit_logs table verified');

  // 8. Seed default certificate templates if none exist
  const existingTemplates = await sql`SELECT count(*) FROM certificate_templates`;
  if (Number(existingTemplates[0]?.count || 0) === 0) {
    await sql`
      INSERT INTO certificate_templates (
        id, name, description, type, title, subtitle, body_template,
        issuer_organization, signatories, branding, layout, is_active
      ) VALUES (
        'tmpl_participation_default',
        'Official Chapter Participation Certificate',
        'Standard ACM IARE accredited certificate for workshops and technical assemblies.',
        'participation',
        'Certificate of Participation',
        'This is to certify that',
        'has successfully participated in the technical event "{{event_title}}" organized by ACM Student Chapter, Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad.',
        'ACM Student Chapter, Institute of Aeronautical Engineering',
        '[
          {"name": "Dr. K. Srinivasa Rao", "role": "Faculty Sponsor", "title": "Professor & Head, CSE"},
          {"name": "Student Chair", "role": "Chapter Chair", "title": "ACM IARE Student Chapter"}
        ]'::jsonb,
        '{"primaryColor": "#00838F", "accentColor": "#14213D", "ribbonText": "IARE"}'::jsonb,
        '{"orientation": "landscape"}'::jsonb,
        true
      ),
      (
        'tmpl_merit_hackathon',
        'Hackathon & Contest Winner Certificate',
        'Distinguished certificate of achievement for competition and hackathon awardees.',
        'winner',
        'Certificate of Excellence',
        'This certificate of honor is awarded to',
        'for outstanding performance and securing a winning position in "{{event_title}}" hosted by ACM Student Chapter, Institute of Aeronautical Engineering.',
        'ACM Student Chapter, Institute of Aeronautical Engineering',
        '[
          {"name": "Dr. K. Srinivasa Rao", "role": "Faculty Sponsor", "title": "Professor & Head, CSE"},
          {"name": "Convener", "role": "Lead Coordinator", "title": "ACM IARE"}
        ]'::jsonb,
        '{"primaryColor": "#B45309", "accentColor": "#14213D", "ribbonText": "WINNER"}'::jsonb,
        '{"orientation": "landscape"}'::jsonb,
        true
      );
    `;
    console.log('✓ Seeded 2 starter certificate templates (Participation & Excellence)');
  }

  // 9. Summary of all tables
  const allTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log('\nAll public tables in Neon database:');
  console.log(allTables.map(t => t.table_name));
  console.log('\nMigration completed successfully!');
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
