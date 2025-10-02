const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require("cors");

const app = express();
app.use(express.json());

app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL 
});

app.get('/', (req, res) => {
  res.send('SafeSight AI Backend is running ');
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Simple endpoint: POST {"image_url":"..."} -> forwards to ML service and stores result
app.post('/detect', async (req, res) => {
  try {
    const mlURL = process.env.ML_SERVICE_URL;

    // Call ML service
    const resp = await axios.post(`${mlURL}/detect`, req.body);
    const detections = resp.data;

    // Save detection to DB
    await pool.query(`
      CREATE TABLE IF NOT EXISTS detections (
        id serial PRIMARY KEY,
        data jsonb,
        created_at timestamptz DEFAULT now()
      )
    `);

    const detQ = await pool.query(
      'INSERT INTO detections(data) VALUES($1) RETURNING id',
      [detections]
    );
    const detectionId = detQ.rows[0].id;

    // Auto-create incidents for each hazard detection
    const incidentResults = [];
    if (detections && detections.detections && detections.detections.length > 0) {
      for (const d of detections.detections) {
        // Example: if ML detects "spill", create an incident
        const type = d.label; // e.g., spill/slip/fall
        const description = `Detected ${d.label} with confidence ${d.confidence}`;

        const incQ = await pool.query(
          'INSERT INTO incidents(detection_id, type, description) VALUES($1, $2, $3) RETURNING *',
          [detectionId, type, description]
        );

        incidentResults.push(incQ.rows[0]);
      }
    }

    res.json({
      ok: true,
      detections,
      detection_id: detectionId,
      incidents: incidentResults
    });
  } catch (err) {
    console.error(err && err.message);
    res.status(500).json({ error: err.message || 'unknown' });
  }
});


// List all incidents
app.get('/incidents', async (req, res) => {
  try {
    const q = await pool.query('SELECT * FROM incidents ORDER BY reported_at DESC');
    res.json(q.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Create an incident
app.post('/incidents', async (req, res) => {
  try {
    const { detection_id, type, description } = req.body;

    const q = await pool.query(
      `INSERT INTO incidents(detection_id, type, description) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [detection_id || null, type, description]
    );

    res.status(201).json(q.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// Update an incident status
app.put('/incidents/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const q = await pool.query(
      'UPDATE incidents SET status=$1 WHERE id=$2 RETURNING *',
      [status, id]
    );

    if (q.rowCount === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(q.rows[0]); // return updated incident
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// Delete an incident
app.delete('/incidents/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM incidents WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

const port = process.env.PORT;
app.listen(port, () => console.log(`Backend listening on ${port}`));

