const ScanLog = require("../models/ScanLog");
const { getMlScore } = require("../services/mlService");
const { safeBrowsingCheck } = require("../services/intelSafeBrowsing");
const { getCache, setCache } = require("../services/cache");

// Whitelist of legitimate domains
const WHITELIST = [
  "christuniversity.in",
  "google.com",
  "microsoft.com",
  "github.com",
  "stackoverflow.com",
  "wikipedia.org",
  "youtube.com",
  "linkedin.com",
  "amazon.com",
];

function normalizeUrl(u) {
  const url = u.trim();
  if (!/^https?:\/\//i.test(url)) return "http://" + url;
  return url;
}

function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace("www.", "");
  } catch {
    return null;
  }
}

function isWhitelisted(url) {
  const domain = extractDomain(url);
  if (!domain) return false;
  return WHITELIST.some((d) => domain.endsWith(d));
}

exports.scanUrl = async (req, res) => {
  try {
    const input = req.body?.url;
    if (!input) return res.status(400).json({ message: "url is required" });

    const url = normalizeUrl(input);
    const cacheKey = `scan:${url}`;

    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });

    // Check whitelist first
    if (isWhitelisted(url)) {
      const doc = await ScanLog.create({
        url,
        mlScore: 0,
        intelFlag: 0,
        intelProvider: "whitelist",
        finalScore: 0,
        verdict: "legit",
      });

      const payload = {
        url: doc.url,
        mlScore: doc.mlScore,
        intelFlag: doc.intelFlag,
        provider: doc.intelProvider,
        finalScore: doc.finalScore,
        verdict: doc.verdict,
      };

      await setCache(cacheKey, payload, 3600);
      return res.json({ ...payload, cached: false, whitelisted: true });
    }

    const mlScore = await getMlScore(url);
    const intel = await safeBrowsingCheck(url);

    const finalScore = 0.7 * mlScore + 0.3 * intel.intelFlag;

    let verdict = "legit";

    if (intel.intelFlag === 1) verdict = "phishing";
    else if (mlScore >= 0.92) verdict = "phishing";
    else if (mlScore >= 0.75) verdict = "suspicious";

    const doc = await ScanLog.create({
      url,
      mlScore,
      intelFlag: intel.intelFlag,
      intelProvider: intel.provider,
      finalScore,
      verdict,
    });

    const payload = {
      url: doc.url,
      mlScore: doc.mlScore,
      intelFlag: doc.intelFlag,
      provider: doc.intelProvider,
      finalScore: doc.finalScore,
      verdict: doc.verdict,
    };

    await setCache(cacheKey, payload, 3600);
    return res.json({ ...payload, cached: false });
  } catch (e) {
    console.error("scan error:", e.message);
    return res.status(500).json({ message: "scan failed", error: e.message });
  }
};
