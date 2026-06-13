-- Week 5: video clip storage for incident evidence
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS clip_url VARCHAR(500);
