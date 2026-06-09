import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import "./Report.css";

const INCIDENT_TYPES = [
  { value: "fire_detected", label: "Fire Detected" },
  { value: "spill_detected", label: "Spill Detected" },
  { value: "equipment_hazard", label: "Equipment Hazard" },
  { value: "worker_in_area", label: "Worker in Area" },
  { value: "slip_risk", label: "Slip Risk" },
];

export default function Report() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    incident_type: "spill_detected",
    severity: "medium",
    location: "",
    image_url: "",
    confidence: "",
    detection_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        incident_type: form.incident_type,
        severity: form.severity,
        location: form.location || undefined,
        image_url: form.image_url || undefined,
      };

      if (form.confidence) {
        payload.confidence = parseFloat(form.confidence);
      }
      if (form.detection_id) {
        payload.detection_id = parseInt(form.detection_id, 10);
      }

      const result = await api.createIncident(payload);
      navigate(`/incidents/${result.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="report-page">
        <div className="page-header">
          <h2>Report Incident</h2>
          <p>Manually log a hazard or link to an existing ML detection</p>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <label>
            Incident Type
            <select
              name="incident_type"
              value={form.incident_type}
              onChange={handleChange}
              required
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Severity
            <select
              name="severity"
              value={form.severity}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            Location
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Warehouse A, Floor 2"
            />
          </label>

          <label>
            Detection ID (optional)
            <input
              type="number"
              name="detection_id"
              value={form.detection_id}
              onChange={handleChange}
              placeholder="Link to ML detection #"
            />
          </label>

          <label>
            Image URL (optional)
            <input
              type="url"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="http://localhost:9000/safesight-ai/..."
            />
          </label>

          <label>
            Confidence (optional)
            <input
              type="number"
              name="confidence"
              value={form.confidence}
              onChange={handleChange}
              min="0"
              max="1"
              step="0.01"
              placeholder="0.85"
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
