-- detections table 
CREATE TABLE detections (
  id SERIAL PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some seed/test data
INSERT INTO detections (data) VALUES
  ('{"object":"helmet","confidence":0.95}'),
  ('{"object":"vest","confidence":0.89}');

-- incidents table
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    detection_id INT REFERENCES detections(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- spill, fall, slip, etc.
    description TEXT,
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved
    reported_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
