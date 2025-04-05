require('dotenv').config({ path: './config.env' });

console.log('MONGODB_URI exists?', !!process.env.MONGODB_URI);
console.log('MONGODB_DB_NAME exists?', !!process.env.MONGODB_DB_NAME);