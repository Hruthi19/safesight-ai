const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://safesight:safesight@localhost:5433/safesight",
});

module.exports = pool;
