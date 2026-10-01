import { Router } from "express";
import env from "../config/env.js";
import { testDatabaseConnection } from "../config/database.js";

const router = Router();

router.get("/health", (request, response) => {
  response.json({ success: true, message: "RentNest API is running" });
});

if (env.nodeEnv === "development") {
  router.get("/health/database", async (request, response) => {
    response.set("Cache-Control", "no-store");
    try {
      await testDatabaseConnection();
      response.json({ success: true, database: "connected" });
    } catch {
      response.status(503).json({ success: false, message: "Database unavailable" });
    }
  });
}

export default router;
