import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import env from "./config/env.js"
import authRoutes from "./routes/auth.routes.js"
import healthRoutes from "./routes/health.routes.js"
import propertyRoutes from "./routes/property.routes.js"
import favoriteRoutes from "./routes/favorite.routes.js"
import rentalRoutes from "./routes/rental.routes.js"
import ownerPropertiesRoutes from "./routes/owner-properties.routes.js"
import notFound from "./middleware/not-found.js"
import errorHandler from "./middleware/error-handler.js"

const app = express()

app.disable("x-powered-by")
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: "100kb" }))
app.use("/api", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/properties", propertyRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api", rentalRoutes)
app.use("/api", ownerPropertiesRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
