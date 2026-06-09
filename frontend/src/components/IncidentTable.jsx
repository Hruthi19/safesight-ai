import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SeverityBadge, StatusBadge } from "./StatusBadge";
import "./IncidentTable.css";

const COLUMNS = [
  { key: "id", label: "ID" },
  { key: "incident_type", label: "Type" },
  { key: "severity", label: "Severity" },
  { key: "status", label: "Status" },
  { key: "location", label: "Location" },
  { key: "created_at", label: "Reported" },
];

export default function IncidentTable({ incidents }) {
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    return [...incidents].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      }

      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [incidents, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (incidents.length === 0) {
    return (
      <div className="empty-state">
        <p>No incidents yet.</p>
        <Link to="/report">Report an incident</Link>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="incident-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}
                {sortKey === col.key && (
                  <span className="sort-icon">{sortDir === "asc" ? " ▲" : " ▼"}</span>
                )}
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((incident) => (
            <tr key={incident.id}>
              <td>#{incident.id}</td>
              <td>{incident.incident_type?.replace(/_/g, " ")}</td>
              <td>
                <SeverityBadge severity={incident.severity} />
              </td>
              <td>
                <StatusBadge status={incident.status} />
              </td>
              <td>{incident.location || "—"}</td>
              <td>{new Date(incident.created_at).toLocaleString()}</td>
              <td>
                <Link to={`/incidents/${incident.id}`} className="link-btn">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
