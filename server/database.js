// database.js
const { MongoClient } = require('mongodb');
const config = require('./config');

const MONGODB_URI = config.MONGODB_URI;
const MONGODB_DB_NAME = config.MONGODB_DB_NAME;

let client = null;
let db = null;

async function connectToDatabase() {
  if (db) return db;
  
  try {
    client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
    db = client.db(MONGODB_DB_NAME);
    console.log('Connected to MongoDB successfully');
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection
};