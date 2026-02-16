const axios = require("axios");

async function safeBrowsingCheck(url) {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  if (!apiKey) return { intelFlag: 0, provider: "none" };

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  const body = {
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const res = await axios.post(endpoint, body, { timeout: 5000 });
  const flagged =
    Array.isArray(res.data?.matches) && res.data.matches.length > 0;

  return { intelFlag: flagged ? 1 : 0, provider: "safe_browsing" };
}

module.exports = { safeBrowsingCheck };
