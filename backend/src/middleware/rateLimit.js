const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
});
