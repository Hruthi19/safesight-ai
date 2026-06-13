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
  const week3 = fs.readFileSync(
    path.join(__dirname, "../../db/migrate_week3.sql"),
    "utf8"
  );
  await pool.query(week3);

  const week5Path = path.join(__dirname, "../../db/migrate_week5.sql");
  if (fs.existsSync(week5Path)) {
    const week5 = fs.readFileSync(week5Path, "utf8");
    await pool.query(week5);
  }

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
