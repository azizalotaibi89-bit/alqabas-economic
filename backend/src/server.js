require('dotenv').config();
const express = require('express');
const cors = require('cors');
const newsRouter = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || '*',
  ],
  methods: ['GET'],
  credentials: false,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'القبس الاقتصادي API', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/news', newsRouter);

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
});
