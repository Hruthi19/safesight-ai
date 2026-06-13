import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AlertToast.css";

function ToastItem({ alert, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`alert-toast ${alert.type === "escalated" ? "alert-escalated" : ""}`}
    >
      <button
        type="button"
        className="alert-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
      <strong>
        {alert.type === "escalated" ? "🚨 Escalation" : "⚠️ New Hazard"}
      </strong>
      <p>
        {alert.incident_type?.replace(/_/g, " ")} — {alert.severity} severity
      </p>
      {alert.id && (
        <Link to={`/incidents/${alert.id}`} onClick={onClose}>
          View incident →
        </Link>
      )}
    </div>
  );
}

export default function AlertToast({ alerts, onDismiss }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (alerts.length > 0) {
      const latest = alerts[alerts.length - 1];
      setVisible((prev) => [...prev, { ...latest, key: Date.now() }]);
    }
  }, [alerts]);

  const dismiss = (key) => {
    setVisible((prev) => prev.filter((a) => a.key !== key));
    onDismiss?.();
  };

  if (visible.length === 0) return null;

  return (
    <div className="alert-toast-container">
      {visible.map((alert) => (
        <ToastItem
          key={alert.key}
          alert={alert}
          onClose={() => dismiss(alert.key)}
        />
      ))}
    </div>
  );
}
