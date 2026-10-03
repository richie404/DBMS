import mysql from "mysql2/promise";
import env from "./env.js";

const pool = mysql.createPool({
  ...env.database,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 20,
  connectTimeout: 5000,
  charset: "utf8mb4",
});

export async function testDatabaseConnection() {
  await pool.query({ sql: "SELECT 1", timeout: 5000 });
}

export default pool;
