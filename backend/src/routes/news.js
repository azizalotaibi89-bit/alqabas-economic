const express = require('express');
const router = express.Router();
const { getNews } = require('../services/newsScraper');

// GET /api/news - fetch all tweets/news
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, page = 1 } = req.query;
    let articles = await getNews();

    // Filter by category
    if (category && category !== 'all') {
      articles = articles.filter((t) => t.category === category);
    }

    // Paginate
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginated = articles.slice(startIndex, endIndex);

    res.json({
      success: true,
      total: articles.length,
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
    const articles = await getNews();
    res.json({ success: true, data: articles.slice(0, 5) });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch latest news' });
  }
});

// GET /api/news/categories - get available categories
router.get('/categories', async (req, res) => {
  try {
    const articles = await getNews();
    const categories = [...new Set(articles.map((t) => t.category))];
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/news/:id - get single news item
router.get('/:id', async (req, res) => {
  try {
    const articles = await getNews();
    const tweet = articles.find((t) => t.id === req.params.id);
    if (!tweet) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.json({ success: true, data: tweet });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch article' });
  }
});

module.exports = router;
