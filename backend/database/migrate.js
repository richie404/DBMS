import { readdir, readFile } from "node:fs/promises";
import pool from "../src/config/database.js";

const directory = new URL("./migrations/", import.meta.url);
let connection;
let lockName;
let locked = false;
let currentMigration;

try {
  connection = await pool.getConnection();
  const [[database]] = await connection.query("SELECT DATABASE() AS name");
  lockName = `${database.name}:schema_migrations`;
  const [[lock]] = await connection.execute("SELECT GET_LOCK(?, 0) AS acquired", [lockName]);
  if (lock.acquired !== 1) throw new Error("Another migration runner is active. Retry after it finishes.");
  locked = true;

  await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const files = (await readdir(directory)).filter(name => /^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
  const [rows] = await connection.query("SELECT migration_name FROM schema_migrations");
  const applied = new Set(rows.map(row => row.migration_name));
  const pending = files.filter(name => !applied.has(name));
  if (!pending.length) console.log("No pending migrations.");

  for (const name of pending) {
    currentMigration = name;
    const sql = await readFile(new URL(name, directory), "utf8");
    // One SQL statement per file. MariaDB DDL commits implicitly, so a
    // transaction cannot atomically combine table creation and tracking.
    await connection.query(sql);
    await connection.execute("INSERT INTO schema_migrations (migration_name) VALUES (?)", [name]);
    console.log(`Applied ${name}`);
  }
} catch (error) {
  console.error(`Migration failed${currentMigration ? ` (${currentMigration})` : ""}: ${error.code ?? "ERROR"} — ${error.message}`);
  console.error("Stopped. Inspect the database before retrying: DDL may already have committed. No failed migration is marked as applied.");
  process.exitCode = 1;
} finally {
  try {
    if (locked) await connection.execute("SELECT RELEASE_LOCK(?)", [lockName]);
  } finally {
    connection?.release();
    await pool.end();
  }
}
