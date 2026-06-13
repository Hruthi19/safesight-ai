-- Week 2: detection metadata from ML service
CREATE TABLE IF NOT EXISTS detections (
  id SERIAL PRIMARY KEY,
  label VARCHAR(100) NOT NULL,
  confidence FLOAT NOT NULL,
  bbox TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Week 3: users with RBAC roles
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'manager', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Week 3: incident workflow
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  detection_id INT REFERENCES detections(id) ON DELETE SET NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium',
  status VARCHAR(50) NOT NULL DEFAULT 'detected',
  location VARCHAR(200),
  image_url VARCHAR(500),
  confidence FLOAT,
  bbox TEXT,
  timestamp VARCHAR(50),
  clip_url VARCHAR(500),
  assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Week 3: workflow step history
CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  incident_id INT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  step VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  performed_by INT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_incident ON workflow_steps(incident_id);
