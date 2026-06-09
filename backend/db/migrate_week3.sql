-- Migration for existing databases created before Week 3

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  step VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  performed_by INT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS timestamp VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS detection_id INT REFERENCES detections(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'detected';
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE incidents SET status = 'detected' WHERE status IS NULL;
UPDATE incidents SET severity = 'medium' WHERE severity IS NULL;
UPDATE incidents SET incident_type = 'unknown' WHERE incident_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_incident ON workflow_steps(incident_id);
