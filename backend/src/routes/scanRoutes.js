const router = require("express").Router();
const { scanUrl } = require("../controllers/scanController");

router.post("/scan", scanUrl);

module.exports = router;
