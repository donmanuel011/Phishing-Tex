const ScanLog = require("../models/ScanLog");

exports.stats = async (req, res) => {
  try {
    const total = await ScanLog.countDocuments();
    const phishing = await ScanLog.countDocuments({ verdict: "phishing" });
    const legit = await ScanLog.countDocuments({ verdict: "legit" });

    const dailyTrend = await ScanLog.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          phishingCount: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "phishing"] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      total,
      phishing,
      legit,
      phishingRate: total ? phishing / total : 0,
      dailyTrend
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.recent = async (req, res) => {
  try {
    const docs = await ScanLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

