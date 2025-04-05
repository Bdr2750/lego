const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  scrapedDate: Date,
  legoSetId: String
});

module.exports = mongoose.model('Sale', saleSchema);