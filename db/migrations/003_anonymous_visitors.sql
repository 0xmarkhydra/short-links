ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS visitor_source VARCHAR(16) NOT NULL DEFAULT 'FINGERPRINT'
    CHECK (visitor_source IN ('COOKIE', 'FINGERPRINT')),
  ADD COLUMN IF NOT EXISTS is_returning BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS visits_link_visitor_idx
  ON visits(link_id, visitor_hash, created_at ASC);

CREATE INDEX IF NOT EXISTS visits_link_returning_idx
  ON visits(link_id, is_returning, created_at DESC);
