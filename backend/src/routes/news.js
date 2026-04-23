const express = require('express');
const router = express.Router();
const { getTweets } = require('../services/twitterScraper');

// GET /api/news - fetch all tweets/news
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    let tweets = await getTweets();

    // Filter by category
    if (category && category !== 'all') {
      tweets = tweets.filter((t) => t.category === category);
    }

    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginated = tweets.slice(startIndex, endIndex);

    res.json({
      success: true,
      total: tweets.length,
      page: parseInt(page),
      limit: parseInt(limit),
      data: paginated,
    });
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch news' });
  }
});

// GET /api/news/latest - get the 5 most recent
router.get('/latest', async (req, res) => {
  try {
    const tweets = await getTweets();
    res.json({ success: true, data: tweets.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch latest news' });
  }
});

// GET /api/news/categories - get available categories
router.get('/categories', async (req, res) => {
  try {
    const tweets = await getTweets();
    const categories = [...new Set(tweets.map((t) => t.category))];
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/news/:id - get single news item
router.get('/:id', async (req, res) => {
  try {
    const tweets = await getTweets();
    const tweet = tweets.find((t) => t.id === req.params.id);
    if (!tweet) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.json({ success: true, data: tweet });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch article' });
  }
});

module.exports = router;
