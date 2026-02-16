const router = require("express").Router();
const { stats, recent } = require("../controllers/adminController");

router.get("/stats", stats);
router.get("/recent", recent);

module.exports = router;
