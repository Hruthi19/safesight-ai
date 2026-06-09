const pool = require("../db/pool");

function parseToken(token) {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function createToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const decoded = parseToken(token);
  if (!decoded?.userId) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  const result = await pool.query(
    "SELECT id, username, role FROM users WHERE id = $1",
    [decoded.userId]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ success: false, error: "User not found" });
  }

  req.user = result.rows[0];
  next();
}

module.exports = { authenticate, createToken };
