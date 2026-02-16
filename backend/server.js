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

/**
 * ✅ Needed on Render/Railway/Heroku so req.ip works correctly behind proxy
 * (important for rate limiting + logs)
 */
app.set("trust proxy", 1);

/**
 * ✅ Security + parsers
 */
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

/**
 * ✅ CORS
 * - Allows localhost during development
 * - Allows your deployed frontend using FRONTEND_URL env
 *   Example: FRONTEND_URL=https://phishing-tex-1.onrender.com
 */
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL, // set this in Render backend env
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like curl/postman (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight
app.options("/*", cors());


/**
 * ✅ Rate limiter after CORS
 */
app.use(limiter);

/**
 * ✅ Routes
 */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Phish Detector Backend is running 🚀",
  });
});

app.use("/api", scanRoutes);
app.use("/api/admin", adminRoutes);

/**
 * ✅ Start server
 */
async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  if (!process.env.ML_SERVICE_URL) {
    console.warn("⚠️ ML_SERVICE_URL not set. /api/scan may fail.");
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
  console.error("❌ Startup error:", e.message || e);
  process.exit(1);
});
