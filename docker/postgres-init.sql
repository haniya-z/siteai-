-- SiteAI PostgreSQL Schema
-- Sprint 2 Foundation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Tenants / Organisations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organisations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES organisations(id) ON DELETE CASCADE,
    email           VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    full_name       VARCHAR(255),
    role            VARCHAR(50) DEFAULT 'engineer',  -- owner|engineer|contractor|viewer
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID REFERENCES organisations(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(255),
    capacity_mw     DECIMAL(10,2),
    tier            VARCHAR(20) DEFAULT 'IV',
    status          VARCHAR(50) DEFAULT 'active',
    baseline_completion DATE,
    forecast_completion DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Documents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    filename        VARCHAR(500) NOT NULL,
    doc_type        VARCHAR(100),   -- spec|submittal|rfi|schedule|drawing|change_order
    storage_path    VARCHAR(500),
    file_size_bytes BIGINT,
    indexed         BOOLEAN DEFAULT false,
    chunk_count     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NCRs (Non-Conformance Records) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ncrs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    ncr_number      VARCHAR(50) UNIQUE NOT NULL,
    asset_id        VARCHAR(255),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    severity        VARCHAR(20) DEFAULT 'minor',  -- critical|major|minor
    status          VARCHAR(50) DEFAULT 'open',   -- open|escalated|closed
    detected_by     VARCHAR(100) DEFAULT 'ai',
    agent_reasoning TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Decision Ledger ────────────────────────────────────────────────────
-- Append-only in spirit (no updates in application code)
CREATE TABLE IF NOT EXISTS agent_decisions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    agent_name      VARCHAR(100) NOT NULL,
    task_type       VARCHAR(100) NOT NULL,
    query           TEXT,
    context_summary TEXT,
    output          JSONB,
    confidence      DECIMAL(5,4),
    model_used      VARCHAR(100),
    tokens_used     INTEGER,
    latency_ms      INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Assets (lightweight relational mirror of graph nodes) ────────────────────
CREATE TABLE IF NOT EXISTS assets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    asset_tag       VARCHAR(100) NOT NULL,
    asset_type      VARCHAR(100),   -- transformer|switchgear|ahu|generator|ups|chiller
    name            VARCHAR(255),
    specification   JSONB DEFAULT '{}',
    current_status  VARCHAR(50) DEFAULT 'active',
    graph_node_id   VARCHAR(255),   -- Neo4j element ID reference
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, asset_tag)
);

-- ─── Procurement Items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurement_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    asset_id        UUID REFERENCES assets(id),
    vendor_name     VARCHAR(255),
    item_description VARCHAR(500),
    required_by     DATE,
    eta             DATE,
    status          VARCHAR(50) DEFAULT 'on_track',  -- on_track|at_risk|delayed|cancelled
    delay_days      INTEGER DEFAULT 0,
    unit_cost       DECIMAL(15,2),
    currency        VARCHAR(10) DEFAULT 'USD',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_ncrs_project ON ncrs(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_project ON agent_decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_procurement_project ON procurement_items(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_created ON agent_decisions(created_at DESC);

-- ─── Seed Data ────────────────────────────────────────────────────────────────
INSERT INTO organisations (id, name, slug) VALUES
    ('00000000-0000-0000-0000-000000000001', 'SiteAI Demo Org', 'siteai-demo')
ON CONFLICT DO NOTHING;

INSERT INTO projects (id, org_id, name, description, location, capacity_mw, tier, status, baseline_completion, forecast_completion) VALUES
    ('00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     'Mumbai HYP-1',
     '120 MW Hyperscale Data Centre — Phase 2',
     'Mumbai, Maharashtra, India',
     120.00,
     'IV',
     'active',
     '2026-11-01',
     '2026-11-28')
ON CONFLICT DO NOTHING;

INSERT INTO users (org_id, email, hashed_password, full_name, role) VALUES
    ('00000000-0000-0000-0000-000000000001',
     'demo@siteai.dev',
     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj0bN4yT1g5.',
     'Demo Engineer',
     'owner')
ON CONFLICT DO NOTHING;
