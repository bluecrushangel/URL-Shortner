const express = require('express');
const { nanoid } = require('nanoid');
const db = require('./db');
const redis = require('./redis');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Shorten a URL
router.post('/shorten', async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  const code = nanoid(7); // generates a 7 character ID e.g. "aB3xK9p"

  await db.query(
    'INSERT INTO urls (code, original_url) VALUES ($1, $2)',
    [code, url]
  );

  res.json({ short_url: `http://localhost:3000/${code}`, code });
});

// Redirect + publish click event
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  // 1. Check Redis cache first
  const cached = await redis.get(`url:${code}`);

  if (cached) {
    // publish click event to analytics
    await redis.publish('clicks', JSON.stringify({
      code,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }));
    return res.redirect(cached);
  }

  // 2. Cache miss — fetch from database
  const result = await db.query(
    'SELECT original_url FROM urls WHERE code = $1',
    [code]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'URL not found' });
  }

  const originalUrl = result.rows[0].original_url;

  // 3. Store in cache for next time (expires after 24 hours)
  await redis.setEx(`url:${code}`, 86400, originalUrl);

  // 4. Publish click event
  await redis.publish('clicks', JSON.stringify({
    code,
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  }));

  res.redirect(originalUrl);
});

module.exports = router;