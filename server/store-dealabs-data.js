// store-dealabs-data.js
const { connectToDatabase, closeDatabaseConnection } = require('./database');
const fs = require('fs');
const path = require('path');

async function storeDealabsResults() {
  let client = null;
  
  try {
    // Load dealabs results from file
    const dealabsPath = path.join(__dirname, 'dealabs_results.json');
    const dealabsData = JSON.parse(fs.readFileSync(dealabsPath, 'utf8'));
    
    console.log(`Loaded ${dealabsData.length} deals from dealabs_results.json`);
    
    // Connect to the database
    const db = await connectToDatabase();
    
    // Store in MongoDB
    const collection = db.collection('deals');
    const result = await collection.insertMany(dealabsData);
    
    console.log(`${result.insertedCount} deals inserted successfully into MongoDB`);
    
    // Implement the required query methods
    console.log("\nTesting query methods:");
    
    // 1. Find best discount deals
    console.log("\n1. Best discount deals:");
    const bestDiscountDeals = await collection.find()
      .sort({ discountPercentage: -1 })
      .limit(3)
      .toArray();
    console.log(bestDiscountDeals);
    
    // 2. Find most commented deals
    console.log("\n2. Most commented deals:");
    const mostCommentedDeals = await collection.find()
      .sort({ commentCount: -1 })
      .limit(3)
      .toArray();
    console.log(mostCommentedDeals);
    
    // 3. Find deals sorted by price
    console.log("\n3. Deals sorted by price (low to high):");
    const dealsByPrice = await collection.find()
      .sort({ price: 1 })
      .limit(3)
      .toArray();
    console.log(dealsByPrice);
    
    // 4. Find deals sorted by date
    console.log("\n4. Deals sorted by date (newest first):");
    const dealsByDate = await collection.find()
      .sort({ date: -1 })
      .limit(3)
      .toArray();
    console.log(dealsByDate);
    
    // 5. Find sales for a specific Lego set (adapt field names as needed)
    console.log("\n5. Sales for a specific Lego set:");
    const legoSetId = dealabsData[0]?.title?.split(' ')[0] || '42156'; // Using first word of first item's title
    const salesBySetId = await collection.find({
      title: { $regex: legoSetId, $options: 'i' }
    }).toArray();
    console.log(salesBySetId);
    
    // 6. Find recent sales
    console.log("\n6. Recent sales (last 3 weeks):");
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const recentSales = await collection.find({ 
      date: { $gte: threeWeeksAgo } 
    }).toArray();
    console.log(recentSales);
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the database connection
    await closeDatabaseConnection();
  }
}

storeDealabsResults();