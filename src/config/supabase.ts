import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[ArcHire] Supabase env vars not set. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. ' +
    'Falling back to mock data.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

/*
═══════════════════════════════════════════════════════════════
  SUPABASE SQL SCHEMA — run this in the Supabase SQL editor
  Project → SQL Editor → New Query → paste → Run
═══════════════════════════════════════════════════════════════

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  wallet_address TEXT PRIMARY KEY,
  display_name   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AGENTS
CREATE TABLE IF NOT EXISTS public.agents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet      TEXT,                -- wallet that receives escrow payouts
  name              TEXT NOT NULL,
  tagline           TEXT,
  description       TEXT,
  long_description  TEXT,
  category          TEXT NOT NULL CHECK (category IN ('writing','image','code','research','data')),
  price_usdc        NUMERIC(12,6) NOT NULL DEFAULT 0.50,
  avatar_url        TEXT,
  rating            NUMERIC(3,1) DEFAULT 5.0,
  review_count      INT DEFAULT 0,
  jobs_count        INT DEFAULT 0,
  avg_delivery_time TEXT DEFAULT '15m',
  tags              TEXT[] DEFAULT '{}',
  escrow_protected  BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOBS
CREATE TYPE IF NOT EXISTS job_status AS ENUM (
  'created','funded','in_progress','delivered','released','disputed','refunded'
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_wallet     TEXT NOT NULL,
  agent_id         UUID REFERENCES public.agents(id) NOT NULL,
  title            TEXT,
  description      TEXT NOT NULL,
  status           job_status NOT NULL DEFAULT 'created',
  amount_usdc      NUMERIC(12,6) NOT NULL,
  onchain_job_id   TEXT,          -- uint256 job ID from the escrow contract
  tx_hash_fund     TEXT,          -- tx that called createJob()
  tx_hash_release  TEXT,          -- tx that called approveAndRelease()
  delivery_content JSONB,         -- { fileName, fileSize, summary, text }
  tags             TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  delivered_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

-- 4. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID REFERENCES public.jobs(id) NOT NULL,
  agent_id         UUID REFERENCES public.agents(id) NOT NULL,
  reviewer_wallet  TEXT NOT NULL,
  reviewer_name    TEXT,
  rating           INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────
-- NOTE: These are permissive v1 policies (no JWT wallet verification).
-- For production, add a Supabase Edge Function that issues JWTs with
-- wallet_address as a claim and tighten policies with auth.jwt() checks.

ALTER TABLE public.users   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_public_read"   ON public.users FOR SELECT USING (true);
CREATE POLICY "users_public_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_public_update" ON public.users FOR UPDATE USING (true);

-- Agents
CREATE POLICY "agents_public_read"   ON public.agents FOR SELECT USING (true);
CREATE POLICY "agents_public_insert" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "agents_public_update" ON public.agents FOR UPDATE USING (true);

-- Jobs
CREATE POLICY "jobs_public_read"   ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_public_insert" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "jobs_public_update" ON public.jobs FOR UPDATE USING (true);

-- Reviews
CREATE POLICY "reviews_public_read"   ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_public_insert" ON public.reviews FOR INSERT WITH CHECK (true);

-- ─── REALTIME ──────────────────────────────────────────────────
-- Enable Realtime on the jobs table so the dashboard updates live.
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ─── SEED DATA — run AFTER the schema above ────────────────────
-- Replace <AGENT_DEFAULT_WALLET> with the wallet that will receive test payouts.
-- You can use your own deployer wallet address for testing.

INSERT INTO public.agents (name, tagline, description, long_description, category, price_usdc, avatar_url, rating, review_count, jobs_count, avg_delivery_time, tags)
VALUES
  ('VectorMind','Advanced Data Processing & Creative Content Synthesis Specialist','Specialized in rapid info synthesis, structured data transformation, and perfect JSON pipelines.',
   'VectorMind is a high-performance neural architecture specialized in rapid information synthesis and structured data transformation. Designed for precision, this agent can parse complex documents, generate high-fidelity technical content, and automate repetitive data workflows with a 99.8% accuracy rate.',
   'data', 0.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuChXfH6e5TBQmFy253-ie8Wgg77OKkfIONP1VpFeVnHj_PhykXq4mHrzBGxBctyXz8Z3WVu8HWDYie9o_KRbDYK1b55QKgDeXeinDxFo2nA54qT0YbLY_9gJKRxzUuNqYOYAXA1aNY_OLF_--7azkXor4zSG7Ioufk8pKlAtdPEMDGwhBWdWyoHFYWWMl6r05P5R8KEpfGTS_1gq-PqdnTxwIqK2dVKpd6A392usTJPGIjjrHnztQEUAYa2g6jESR6fV7JavLjvfv0', 4.9, 120, 1240, '15m', ARRAY['Natural Language','Data Analysis','JSON Automation']),
  ('CopyBot','Viral SEO and Ad Copy generator','High-conversion sales copy, SEO articles, and catchy Twitter threads in seconds.',
   'CopyBot translates product parameters into copy that converts. Trained on over 100,000 highly successful sales pitches, landing page headlines, and viral social media campaigns. Outfitted with real-time SEO scoring.',
   'writing', 0.50, '✍️', 4.9, 1240, 1240, '5m', ARRAY['SEO','Copywriting','Ad Copy']),
  ('DesignPro','UI Icons & Illustration generator','Bespoke custom vector elements, UI icons, and tactile 3D emoji representations.',
   'DesignPro leverages advanced diffusion fine-tuned on professional digital marketplace assets. Generates flat icons, detailed app visual concepts, and friendly 3D representations that elevate clean software landing pages.',
   'image', 1.20, '🎨', 4.8, 860, 860, '12m', ARRAY['Icons','Vectors','3D UI']),
  ('CodeFix','Advanced Python & Smart Contracts auditor','Find bugs, generate unit tests, write robust solidity scripts, and ensure secure state changes.',
   'CodeFix acts as a fully automated secondary reviewer. Specializes in auditing smart contract files, identifying reentrancy vulnerabilities, gas optimization, and converting complex pseudocode to working Python libraries.',
   'code', 2.50, '💻', 5.0, 430, 430, '8m', ARRAY['Solidity','Python','Auditing']),
  ('DeepSearch','Market & Academic Research crawler','Deep web analysis, scientific summaries, competitive benchmarking and data tables compile.',
   'DeepSearch is geared for comprehensive multi-source indexing. Gathers citations, computes market averages, performs financial ratios comparison, and builds references matrices directly formatted in Markdown or HTML.',
   'research', 0.75, '🔍', 4.7, 2100, 2100, '20m', ARRAY['Market Intel','Synthesizing','Citations']),
  ('DataGenie','CSV Cleanup & Viz and dashboard Generator','Purge duplicate rows, normalizes times, handles missing coordinates, and builds beautiful charts.',
   'DataGenie accepts spreadsheets, raw analytics dump, and returns normalized, cleanly organized database-ready arrays. Can automatically plot chart structures matching modern design aesthetics.',
   'data', 1.50, '📊', 4.9, 515, 515, '15m', ARRAY['CSV Normalizer','Visualization','Charts']),
  ('VoiceCraft','Natural AI Voiceovers & Audio files generator','Convert voice recordings, scripts, or documentation into fully lifelike synthetic voices.',
   'VoiceCraft renders natural pauses, dynamic inflections, and studio-grade voiceover tracks. Choose between warm corporate narrators or enthusiastic startup launch personalities.',
   'writing', 3.00, '🎙️', 4.9, 1040, 1040, '10m', ARRAY['Audio Synthesis','Podcast','Narrations']);

-- After inserting agents, optionally add their owner_wallet:
-- UPDATE public.agents SET owner_wallet = '<AGENT_DEFAULT_WALLET>' WHERE owner_wallet IS NULL;

═══════════════════════════════════════════════════════════════
*/
