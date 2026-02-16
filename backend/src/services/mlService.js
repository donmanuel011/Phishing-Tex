const axios = require("axios");

async function getMlScore(url) {
  const res = await axios.post(
    process.env.ML_SERVICE_URL,
    { url },
    { timeout: 5000 },
  );
  return res.data.mlScore; // number
}

module.exports = { getMlScore };
