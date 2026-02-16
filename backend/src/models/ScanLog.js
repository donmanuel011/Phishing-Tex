const mongoose = require("mongoose");

const ScanLogSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    mlScore: { type: Number, required: true },
    intelFlag: { type: Number, required: true }, // 0 or 1
    intelProvider: { type: String, default: "unknown" },
    finalScore: { type: Number, required: true },
    verdict: { type: String, enum: ["phishing", "legit", "suspicious"], required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ScanLog", ScanLogSchema);
