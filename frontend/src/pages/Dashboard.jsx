import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import AlertToast from "../components/AlertToast";
import IncidentTable from "../components/IncidentTable";
import Layout from "../components/Layout";
import { useSocket } from "../hooks/useSocket";
import "./Dashboard.css";

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastAlerts, setToastAlerts] = useState([]);

  const loadIncidents = useCallback(async () => {
    try {
      setError("");
      const result = await api.getIncidents();
      setIncidents(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSocketEvent = useCallback((event, data) => {
    loadIncidents();

    if (event === "incident:new") {
      setToastAlerts((prev) => [...prev, { type: "new", ...data }]);
    } else if (event === "incident:escalated") {
      setToastAlerts((prev) => [...prev, { type: "escalated", ...data }]);
    }
  }, [loadIncidents]);

  const { connected } = useSocket(handleSocketEvent);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => !["resolved", "closed"].includes(i.status))
      .length,
    high: incidents.filter((i) => i.severity === "high").length,
    escalated: incidents.filter((i) => i.status === "escalated").length,
  };

  return (
    <Layout>
      <AlertToast
        alerts={toastAlerts}
        onDismiss={() => setToastAlerts((prev) => prev.slice(1))}
      />

      <div className="dashboard">
        <div className="page-header">
          <div>
            <h2>Incident Dashboard</h2>
            <p>Monitor and manage workplace hazards in real time</p>
          </div>
          <div className="header-actions">
            <span className="live-indicator">
              <span className={`live-dot ${connected ? "connected" : ""}`} />
              {connected ? "Live" : "Connecting..."}
            </span>
            <button type="button" className="btn-secondary" onClick={loadIncidents}>
              Refresh
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Incidents</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.open}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-card stat-high">
            <span className="stat-value">{stats.high}</span>
            <span className="stat-label">High Severity</span>
          </div>
          <div className="stat-card stat-escalated">
            <span className="stat-value">{stats.escalated}</span>
            <span className="stat-label">Escalated</span>
          </div>
        </div>

        {loading && <p className="loading-text">Loading incidents...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && <IncidentTable incidents={incidents} />}
      </div>
    </Layout>
  );
}
