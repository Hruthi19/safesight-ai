import React from "react";
import { StatusBadge } from "./StatusBadge";
import "./WorkflowTimeline.css";

export default function WorkflowTimeline({ steps = [] }) {
  if (steps.length === 0) {
    return <p className="empty-text">No workflow steps recorded yet.</p>;
  }

  return (
    <div className="workflow-timeline">
      {steps.map((step) => (
        <div key={step.id} className="workflow-item">
          <div className="workflow-dot" />
          <div className="workflow-content">
            <div className="workflow-header">
              <StatusBadge status={step.step} />
              <span className="workflow-time">
                {new Date(step.created_at).toLocaleString()}
              </span>
            </div>
            {step.notes && <p className="workflow-notes">{step.notes}</p>}
            {step.performed_by_username && (
              <p className="workflow-user">By {step.performed_by_username}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
