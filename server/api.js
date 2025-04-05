const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 8092;
const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
const dealsRouter = require('./routes/deals');
const salesRouter = require('./routes/sales');

// Existing endpoint
app.get('/', (req, res) => {
  res.send({ 'ack': true, 'status': 'API ready', 'version': '1.0.0' });
});

// New endpoints
app.use('/deals', dealsRouter);
app.use('/sales', salesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);
});

module.exports = app;