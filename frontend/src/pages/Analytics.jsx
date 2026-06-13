import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import HazardHeatmap from "../components/analytics/HazardHeatmap";
import IncidentTrendChart from "../components/analytics/IncidentTrendChart";
import SeverityChart from "../components/analytics/SeverityChart";
import Layout from "../components/Layout";
import {
  exportIncidentsCsv,
  exportIncidentsPdf,
} from "../utils/exportIncidents";
import "./Analytics.css";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [analyticsRes, incidentsRes] = await Promise.all([
          api.getAnalytics(),
          api.getIncidents(),
        ]);
        setAnalytics(analyticsRes.data);
        setIncidents(incidentsRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExportCsv = () => exportIncidentsCsv(incidents);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportIncidentsPdf(incidents);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="analytics-page">
        <div className="page-header">
          <div>
            <h2>Analytics & Insights</h2>
            <p>Incident trends, hazard density, and exportable reports</p>
          </div>
          <div className="export-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportCsv}
              disabled={incidents.length === 0}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleExportPdf}
              disabled={incidents.length === 0 || exporting}
            >
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>

        {loading && <p className="loading-text">Loading analytics...</p>}
        {error && <p className="error-text">{error}</p>}

        {analytics && !loading && (
          <>
            <div className="analytics-summary">
              <div className="summary-card">
                <span className="summary-value">
                  {analytics.summary.totalIncidents}
                </span>
                <span className="summary-label">Total Incidents</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">
                  {analytics.summary.detectionPoints}
                </span>
                <span className="summary-label">Detection Points</span>
              </div>
              <div className="summary-card">
                <span className="summary-value">
                  {analytics.byType?.length || 0}
                </span>
                <span className="summary-label">Hazard Types</span>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card chart-wide">
                <IncidentTrendChart data={analytics.timeSeries} />
              </div>
              <div className="chart-card">
                <SeverityChart data={analytics.bySeverity} />
              </div>
              <div className="chart-card">
                <HazardHeatmap heatmap={analytics.heatmap} />
              </div>
            </div>

            <div className="breakdown-grid">
              <div className="breakdown-card">
                <h3>By Incident Type</h3>
                <ul>
                  {analytics.byType.map((item) => (
                    <li key={item.incident_type}>
                      <span>{item.incident_type.replace(/_/g, " ")}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="breakdown-card">
                <h3>By Status</h3>
                <ul>
                  {analytics.byStatus.map((item) => (
                    <li key={item.status}>
                      <span>{item.status.replace(/_/g, " ")}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
