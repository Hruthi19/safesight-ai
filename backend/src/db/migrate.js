const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("./pool");

const SEED_USERS = [
  { username: "worker1", password: "worker123", role: "worker" },
  { username: "manager1", password: "manager123", role: "manager" },
  { username: "admin1", password: "admin123", role: "admin" },
];

async function runMigrations() {
  const sqlPath = path.join(__dirname, "../../db/migrate_week3.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);

  for (const user of SEED_USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      [user.username, hash, user.role]
    );
  }

  console.log("Database migrations complete");
}

module.exports = { runMigrations };
