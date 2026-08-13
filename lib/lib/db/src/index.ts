import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import fs from "fs";
import path from "path";

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let db: any;

let dbDir = process.env.PGDATA_DIR || path.resolve(process.cwd(), ".data/pgdata");

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000,
  });
  pool.on("error", (err) => console.warn("[AI Studio] Postgres pool background error:", err.message));
  db = drizzlePg(pool, { schema });
} else {
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  } catch {
    dbDir = path.join("/tmp", "pgdata");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }
  const pglite = new PGlite(dbDir);
  db = drizzlePglite(pglite, { schema });
  initPgliteTables(pglite).catch(err => console.error("Error initializing PGlite tables:", err));
}

async function initPgliteTables(pglite: PGlite) {
  try {
    await pglite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        whatsapp TEXT,
        country TEXT NOT NULL,
        industry TEXT NOT NULL,
        role TEXT NOT NULL,
        bio TEXT,
        skills TEXT[] NOT NULL DEFAULT '{}',
        interests TEXT[] NOT NULL DEFAULT '{}',
        verification_status TEXT NOT NULL DEFAULT 'unverified',
        avatar_url TEXT,
        is_business BOOLEAN NOT NULL DEFAULT FALSE,
        business_name TEXT,
        business_registration_number TEXT,
        state_city TEXT,
        sub_industries TEXT[] NOT NULL DEFAULT '{}',
        primary_products TEXT[] NOT NULL DEFAULT '{}',
        services TEXT[] NOT NULL DEFAULT '{}',
        phone TEXT,
        website TEXT,
        public_slug TEXT UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS opportunities (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        country TEXT NOT NULL,
        location TEXT,
        industry TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        author_id INTEGER REFERENCES users(id),
        budget TEXT,
        deadline TIMESTAMP,
        requirements TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS research_submissions (
        id SERIAL PRIMARY KEY,
        submission_id TEXT NOT NULL UNIQUE,
        country TEXT,
        role TEXT,
        stage TEXT,
        goals TEXT,
        resources TEXT,
        obstacles TEXT,
        biggest_obstacle TEXT,
        knowledge_gap TEXT,
        ai_comfort INTEGER,
        ai_trusted_tasks TEXT,
        top_features TEXT,
        usage_frequency TEXT,
        pricing_interest TEXT,
        pricing_range TEXT,
        community_interest TEXT,
        respondent_name TEXT,
        respondent_email TEXT,
        respondent_phone TEXT,
        full_data TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS venture_templates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        industry TEXT NOT NULL,
        sub_industry TEXT,
        product_category TEXT,
        specific_product TEXT,
        description TEXT NOT NULL,
        problem_solved TEXT,
        duration_days INTEGER NOT NULL,
        required_skills TEXT[] NOT NULL DEFAULT '{}',
        required_tools TEXT[] NOT NULL DEFAULT '{}',
        required_resources TEXT[] NOT NULL DEFAULT '{}',
        estimated_timeline TEXT NOT NULL,
        estimated_startup_cost REAL,
        milestones JSONB NOT NULL DEFAULT '[]',
        daily_structure JSONB NOT NULL DEFAULT '[]',
        risk_factors TEXT[] NOT NULL DEFAULT '{}',
        expected_outputs TEXT[] NOT NULL DEFAULT '{}',
        cover_image_url TEXT,
        attachments TEXT[] NOT NULL DEFAULT '{}',
        audio_description TEXT,
        ai_transcript TEXT,
        visibility TEXT NOT NULL DEFAULT 'public',
        creator_id INTEGER,
        clone_count INTEGER NOT NULL DEFAULT 0,
        use_count INTEGER NOT NULL DEFAULT 0,
        template_type TEXT NOT NULL DEFAULT 'business_model',
        difficulty TEXT NOT NULL DEFAULT 'beginner',
        tags TEXT[] NOT NULL DEFAULT '{}',
        follow_count INTEGER NOT NULL DEFAULT 0,
        save_count INTEGER NOT NULL DEFAULT 0,
        adoption_count INTEGER NOT NULL DEFAULT 0,
        fork_count INTEGER NOT NULL DEFAULT 0,
        forked_from_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS template_saves (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id INTEGER NOT NULL REFERENCES venture_templates(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS template_follows (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id INTEGER NOT NULL REFERENCES venture_templates(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS template_interactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        template_id INTEGER NOT NULL REFERENCES venture_templates(id) ON DELETE CASCADE,
        interaction_type TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_instances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id INTEGER NOT NULL REFERENCES venture_templates(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        current_day INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS execution_journal_entries (
        id SERIAL PRIMARY KEY,
        instance_id INTEGER NOT NULL REFERENCES execution_instances(id) ON DELETE CASCADE,
        day INTEGER NOT NULL,
        notes TEXT,
        evidence_urls TEXT[] NOT NULL DEFAULT '{}',
        completed_milestones INTEGER[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        deal_type TEXT NOT NULL,
        country TEXT NOT NULL,
        industry TEXT NOT NULL,
        value REAL,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'draft',
        creator_id INTEGER REFERENCES users(id),
        counterparty_id INTEGER REFERENCES users(id),
        terms JSONB NOT NULL DEFAULT '{}',
        document_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deal_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        default_terms JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coach_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        focus_area TEXT NOT NULL,
        target_hours REAL NOT NULL DEFAULT 8,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coach_tasks (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES coach_plans(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS coach_evidence (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES coach_tasks(id) ON DELETE CASCADE,
        file_url TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feed_posts (
        id SERIAL PRIMARY KEY,
        author_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'update',
        image_url TEXT,
        likes_count INTEGER NOT NULL DEFAULT 0,
        comments_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feed_reactions (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL DEFAULT 'like',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS field_agent_requests (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        country TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        reward TEXT,
        requested_by INTEGER REFERENCES users(id),
        assigned_agent INTEGER REFERENCES users(id),
        verification_data JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        industry TEXT NOT NULL,
        country TEXT NOT NULL,
        location TEXT,
        price TEXT,
        type TEXT NOT NULL DEFAULT 'product',
        seller_id INTEGER REFERENCES users(id),
        contact_info TEXT,
        image_urls TEXT[] NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'info',
        read BOOLEAN NOT NULL DEFAULT FALSE,
        link TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS innovations (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        industry TEXT NOT NULL,
        country TEXT NOT NULL,
        innovator_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'published',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS industry_targets (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        industry TEXT NOT NULL,
        country TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        target_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS knowledge_articles (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        industry TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id),
        read_time TEXT NOT NULL DEFAULT '5 min',
        helpful_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS updates (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'announcement',
        author_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ventures (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        industry TEXT NOT NULL,
        country TEXT NOT NULL,
        stage TEXT NOT NULL DEFAULT 'idea',
        founder_id INTEGER REFERENCES users(id),
        logo_url TEXT,
        website TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  } catch (e) {
    console.error("Failed initializing PGlite schema:", e);
  }
}

export * from "./schema";

