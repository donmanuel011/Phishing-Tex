require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const mongoose = require("mongoose");
const cors = require("cors");

const limiter = require("./src/middleware/rateLimit");
const scanRoutes = require("./src/routes/scanRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const { initRedis } = require("./src/services/cache");

const app = express();

// Needed on Render/Railway/Heroku so req.ip works correctly behind proxy (rate-limit)
app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json());

// ✅ CORS: allow localhost + your deployed frontend (set FRONTEND_URL in env)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // e.g. https://your-app.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(limiter);

app.get("/", (req, res) => res.json({ status: "ok" }));
app.use("/api", scanRoutes);
app.use("/api/admin", adminRoutes);

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment variables");
  }
  if (!process.env.ML_SERVICE_URL) {
    console.warn("⚠️ ML_SERVICE_URL is not set. /api/scan may fail.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");

  if (process.env.REDIS_URL) {
    await initRedis(process.env.REDIS_URL);
    console.log("✅ Redis connected");
  } else {
    console.log("ℹ️ Redis disabled (no REDIS_URL)");
  }

  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`✅ Backend running on port ${port}`));
}

start().catch((e) => {
  console.error("❌ Startup error:", e);
  process.exit(1);
});
