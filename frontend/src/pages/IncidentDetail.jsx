import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import { SeverityBadge, StatusBadge } from "../components/StatusBadge";
import WorkflowTimeline from "../components/WorkflowTimeline";
import { useAuth } from "../context/AuthContext";
import "./IncidentDetail.css";

const MANAGER_STATUSES = [
  "validated",
  "notified",
  "escalated",
  "in_progress",
  "resolved",
  "closed",
];

const WORKER_STATUSES = ["in_progress"];

export default function IncidentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadIncident = async () => {
    try {
      setError("");
      const result = await api.getIncident(id);
      setIncident(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncident();
  }, [id]);

  const allowedStatuses =
    user?.role === "worker"
      ? WORKER_STATUSES
      : user?.role === "manager" || user?.role === "admin"
        ? MANAGER_STATUSES
        : [];

  const canUpdateStatus = allowedStatuses.length > 0;

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setUpdating(true);
    try {
      await api.updateIncidentStatus(id, newStatus, notes);
      setNewStatus("");
      setNotes("");
      await loadIncident();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <p className="loading-text">Loading incident...</p>
      </Layout>
    );
  }

  if (error || !incident) {
    return (
      <Layout>
        <p className="error-text">{error || "Incident not found"}</p>
        <Link to="/">← Back to dashboard</Link>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="incident-detail">
        <Link to="/" className="back-link">← Back to dashboard</Link>

        <div className="detail-header">
          <div>
            <h2>Incident #{incident.id}</h2>
            <p>{incident.incident_type?.replace(/_/g, " ")}</p>
          </div>
          <div className="detail-badges">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h3>Details</h3>
            <dl className="detail-list">
              <dt>Location</dt>
              <dd>{incident.location || "—"}</dd>
              <dt>Confidence</dt>
              <dd>
                {incident.confidence
                  ? `${(incident.confidence * 100).toFixed(1)}%`
                  : "—"}
              </dd>
              <dt>Detection</dt>
              <dd>{incident.detection_label || "Manual report"}</dd>
              <dt>Reported by</dt>
              <dd>{incident.created_by_username || "—"}</dd>
              <dt>Created</dt>
              <dd>{new Date(incident.created_at).toLocaleString()}</dd>
              <dt>Last updated</dt>
              <dd>{new Date(incident.updated_at).toLocaleString()}</dd>
            </dl>
          </div>

          <div className="detail-card">
            <h3>Image Evidence</h3>
            {incident.image_url ? (
              <div className="image-preview">
                <img src={incident.image_url} alt="Incident evidence" />
              </div>
            ) : (
              <p className="empty-text">No image attached</p>
            )}
            {incident.clip_url && (
              <div className="clip-preview" style={{ marginTop: 16 }}>
                <h4>Video Clip</h4>
                <video src={incident.clip_url} controls width="100%" />
              </div>
            )}
          </div>

          <div className="detail-card detail-wide">
            <h3>Workflow History</h3>
            <WorkflowTimeline steps={incident.workflow_steps} />
          </div>

          {canUpdateStatus && (
            <div className="detail-card detail-wide">
              <h3>Update Status</h3>
              <form onSubmit={handleStatusUpdate} className="status-form">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="">Select new status...</option>
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
                <button type="submit" className="btn-primary" disabled={updating}>
                  {updating ? "Updating..." : "Update Status"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
