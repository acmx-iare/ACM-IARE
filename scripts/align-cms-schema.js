const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

async function alignSchema() {
  console.log("Aligning CMS schema columns in Neon PostgreSQL...");

  // 1. Add current_revision if missing
  await sql`ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS current_revision INT DEFAULT 1;`;
  console.log("✓ current_revision column ensured");

  // 2. Add published_content / draft_content if missing
  await sql`ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS published_content JSONB DEFAULT '{}'::jsonb;`;
  await sql`ALTER TABLE cms_pages ADD COLUMN IF NOT EXISTS draft_content JSONB DEFAULT '{}'::jsonb;`;
  console.log("✓ published_content & draft_content columns ensured");

  // 3. Backfill from published_data / draft_data if present
  try {
    await sql`
      UPDATE cms_pages 
      SET published_content = published_data 
      WHERE (published_content IS NULL OR published_content = '{}'::jsonb) AND published_data IS NOT NULL AND published_data != '{}'::jsonb;
    `;
    await sql`
      UPDATE cms_pages 
      SET draft_content = draft_data 
      WHERE (draft_content IS NULL OR draft_content = '{}'::jsonb) AND draft_data IS NOT NULL AND draft_data != '{}'::jsonb;
    `;
    console.log("✓ Backfilled content data from published_data/draft_data");
  } catch (err) {
    console.log("Notice backfilling:", err.message);
  }

  // 4. Verify columns
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cms_pages';
  `;
  console.log("Active columns in cms_pages:", cols.map(c => c.column_name).join(", "));
  console.log("Schema aligned successfully!");
}

alignSchema().catch(console.error);
