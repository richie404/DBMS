import env from "./config/env.js";
import app from "./app.js";
import pool, { testDatabaseConnection } from "./config/database.js";

try {
  await testDatabaseConnection();
  console.log("Database connection: OK");
  const server = app.listen(env.port, () => {
    console.log(`RentNest API running on http://localhost:${env.port}`);
  });

  server.on("error", async (error) => {
    console.error(error.code === "EADDRINUSE"
      ? `Port ${env.port} is already in use. Stop the conflicting service or configure PORT.`
      : "Unable to start RentNest API.");
    await pool.end();
    process.exitCode = 1;
  });

  const shutdown = () => {
    server.close(async () => {
      await pool.end();
    });
    server.closeIdleConnections();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch {
  console.error("Database connection: FAILED. Check the XAMPP database service, DB_HOST, DB_PORT, credentials, and DB_NAME.");
  await pool.end();
  process.exitCode = 1;
}
