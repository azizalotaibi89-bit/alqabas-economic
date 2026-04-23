const express = require('express');
const router = express.Router();
const { getStocks } = require('../services/stockService');

// GET /api/stocks - get top 5 gainers and top 5 losers from Boursa Kuwait
router.get('/', async (req, res) => {
  try {
    const data = await getStocks();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching stocks:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stock data' });
  }
});

module.exports = router;
