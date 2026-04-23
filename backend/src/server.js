require('dotenv').config();
const express = require('express');
const cors = require('cors');
const newsRouter = require('./routes/news');
const stocksRouter = require('./routes/stocks');
const tendersRouter = require('./routes/tenders');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — allow all origins (public read-only API, no credentials)
app.use(cors({
  origin: true,
  methods: ['GET', 'OPTIONS'],
  credentials: false,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'القبس الاقتصادي API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/news', newsRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/tenders', tendersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 القبس الاقتصادي API running on port ${PORT}`);
  console.log(`📰 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 News API: http://localhost:${PORT}/api/news`);
  console.log(`📊 Stocks API: http://localhost:${PORT}/api/stocks`);
  console.log(`📋 Tenders API: http://localhost:${PORT}/api/tenders`);
});
