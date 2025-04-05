const express = require('express');
const router = express.Router();
const Sale = require('../models/sale');

router.get('/search', async (req, res) => {
  try {
    const { limit = 12, legoSetId } = req.query;
    const query = {};
    
    if (legoSetId) query.legoSetId = legoSetId;

    const results = await Sale.find(query)
      .sort({ scrapedDate: -1 })
      .limit(Number(limit))
      .populate('deal');

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