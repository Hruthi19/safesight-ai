const ROLE_PERMISSIONS = {
  worker: new Set(["incidents:create", "incidents:read", "incidents:update_own"]),
  manager: new Set([
    "incidents:create",
    "incidents:read",
    "incidents:update_status",
    "incidents:escalate",
  ]),
  admin: new Set(["*"]),
};

const STATUS_PERMISSIONS = {
  worker: new Set(["in_progress"]),
  manager: new Set(["validated", "notified", "escalated", "in_progress", "resolved", "closed"]),
  admin: new Set(["validated", "notified", "escalated", "in_progress", "resolved", "closed"]),
};

const VALID_STATUSES = new Set([
  "detected",
  "validated",
  "notified",
  "escalated",
  "in_progress",
  "resolved",
  "closed",
]);

function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || new Set();
  return perms.has("*") || perms.has(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ success: false, error: "Insufficient permissions" });
    }

    next();
  };
}

function canUpdateStatus(role, status) {
  if (role === "admin") return true;
  const allowed = STATUS_PERMISSIONS[role] || new Set();
  return allowed.has(status);
}

module.exports = {
  hasPermission,
  requirePermission,
  canUpdateStatus,
  VALID_STATUSES,
};
