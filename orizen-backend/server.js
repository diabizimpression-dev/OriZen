import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

// =====================================================
// 1. CONFIGURATION & ENV
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: dotenv must be called BEFORE any other import
// that reads process.env. In ES modules all imports are hoisted
// so we read PORT directly from process.env here after dotenv.config.
dotenv.config({ path: path.join(__dirname, ".env") });

import { APP_CONFIG } from "./src/config/app/settings.js";

// =====================================================
// 2. APP SETUP
// =====================================================
const app = express();
// Read PORT from process.env directly (already loaded by dotenv above)
// This avoids the ES module hoisting issue where APP_CONFIG.PORT
// is evaluated before dotenv has a chance to set process.env.PORT.
const PORT = parseInt(process.env.PORT || "4000", 10);

app.use(helmet({
  contentSecurityPolicy: false, // Permet le chargement de scripts externes si nécessaire
}));
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30
});
app.use("/api/", limiter);

// =====================================================
// 3. ROUTES
// =====================================================
import assistantRouter from "./src/routes/assistant.js";
import dashboardRouter from "./src/routes/dashboard.js";
import directoryRouter from "./src/routes/directory.js";
import plansRouter from "./src/routes/plans.js";

app.use("/api/assistant", assistantRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/structures", directoryRouter);
app.use("/api/plans", plansRouter);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "OriZen Backend", port: PORT });
});

// =====================================================
// 4. STATIC FILES & SPA FALLBACK
// =====================================================
app.use(express.static(path.join(__dirname, "..")));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// =====================================================
// 5. SERVER LAUNCH
// =====================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur OriZen proprement organisé lancé sur http://0.0.0.0:${PORT}`);
});
