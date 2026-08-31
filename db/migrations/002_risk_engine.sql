ALTER TABLE share_links ADD COLUMN IF NOT EXISTS risk_state VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS risk_score SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS risk_reasons JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS risk_provider VARCHAR(80);
ALTER TABLE share_links ADD COLUMN IF NOT EXISTS risk_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS share_links_risk_state_idx ON share_links(risk_state);
CREATE INDEX IF NOT EXISTS share_links_risk_checked_at_idx ON share_links(risk_checked_at);

CREATE TABLE IF NOT EXISTS link_risk_scans (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  trigger VARCHAR(24) NOT NULL,
  state VARCHAR(16) NOT NULL,
  score SMALLINT NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  provider VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS link_risk_scans_link_id_created_at_idx ON link_risk_scans(link_id, created_at DESC);

CREATE TABLE IF NOT EXISTS link_reports (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES share_links(id) ON DELETE CASCADE,
  reporter_hash CHAR(64) NOT NULL,
  reason VARCHAR(32) NOT NULL,
  details VARCHAR(500),
  auto_state VARCHAR(16),
  auto_score SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS link_reports_link_id_created_at_idx ON link_reports(link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS link_reports_reporter_hash_created_at_idx ON link_reports(reporter_hash, created_at DESC);
