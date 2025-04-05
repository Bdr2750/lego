const express = require('express');
const router = express.Router();
const Deal = require('../models/deal');

router.get('/:id', async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    deal ? res.json(deal) : res.status(404).json({ error: 'Deal not found' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { limit = 12, price, date, filterBy } = req.query;
    const query = {};
    
    if (price) query.price = { $lte: Number(price) };
    if (date) query.published = { $gte: new Date(date) };
    
    let sort = { price: 1 };
    if (filterBy === 'best-discount') sort = { discount: -1 };
    if (filterBy === 'most-commented') sort = { commentsCount: -1 };

    const results = await Deal.find(query)
      .sort(sort)
      .limit(Number(limit));

    res.json({
      limit: Number(limit),
      total: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;