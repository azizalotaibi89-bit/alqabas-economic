const express = require('express');
const router = express.Router();
const { getTenders } = require('../services/tenderService');

// GET /api/tenders - get latest Kuwait government tenders from CAPT
router.get('/', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    let tenders = await getTenders();
    tenders = tenders.slice(0, parseInt(limit));
    res.json({ success: true, total: tenders.length, data: tenders });
  } catch (err) {
    console.error('Error fetching tenders:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch tenders' });
  }
});

module.exports = router;
