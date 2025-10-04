const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Visitor statistics storage (in production, use a database)
let visitorStats = {
    online: Math.floor(Math.random() * 50) + 10,
    peak: Math.floor(Math.random() * 200) + 100,
    total: Math.floor(Math.random() * 10000) + 5000,
    lastUpdated: new Date()
};

// API endpoint for visitor statistics
app.get('/api/stats', (req, res) => {
    // Update online count slightly for realism (simulating real-time changes)
    visitorStats.online = Math.max(1, visitorStats.online + Math.floor(Math.random() * 6) - 3);
    visitorStats.lastUpdated = new Date();

    res.json({
        online: visitorStats.online,
        peak: visitorStats.peak,
        total: visitorStats.total
    });
});

// API endpoint to update peak and total (for admin use)
app.post('/api/stats/update', (req, res) => {
    const { peak, total } = req.body;

    if (peak !== undefined && peak > visitorStats.peak) {
        visitorStats.peak = peak;
    }

    if (total !== undefined) {
        visitorStats.total = total;
    }

    res.json({ success: true, stats: visitorStats });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Visitor Stats API server running on port ${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET  /api/stats - Get visitor statistics`);
    console.log(`  POST /api/stats/update - Update peak/total counts`);
    console.log(`  GET  /api/health - Health check`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
