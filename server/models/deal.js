const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: String,
  price: Number,
  temperature: Number,
  commentsCount: Number,
  freeShipping: Boolean,
  imageUrl: String,
  link: String,
  source: String,
  published: Date,
  legoSetId: String
});

module.exports = mongoose.model('Deal', dealSchema);