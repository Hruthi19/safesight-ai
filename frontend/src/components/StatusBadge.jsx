import React from "react";

const STATUS_STYLES = {
  detected: { bg: "#dbeafe", color: "#1d4ed8" },
  validated: { bg: "#d1fae5", color: "#047857" },
  notified: { bg: "#ede9fe", color: "#6d28d9" },
  escalated: { bg: "#fee2e2", color: "#b91c1c" },
  in_progress: { bg: "#fef3c7", color: "#b45309" },
  resolved: { bg: "#dcfce7", color: "#15803d" },
  closed: { bg: "#e2e8f0", color: "#475569" },
};

const SEVERITY_STYLES = {
  high: { bg: "#fee2e2", color: "#b91c1c" },
  medium: { bg: "#fef3c7", color: "#b45309" },
  low: { bg: "#dbeafe", color: "#1d4ed8" },
};

export function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color }}
    >
      {status?.replace("_", " ")}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  const style = SEVERITY_STYLES[severity] || { bg: "#e2e8f0", color: "#475569" };
  return (
    <span
      className="badge"
      style={{ background: style.bg, color: style.color }}
    >
      {severity}
    </span>
  );
}
