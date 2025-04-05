// dealService.js
const { connectToDatabase } = require('./database');

// Insert deals into database
async function insertDeals(deals) {
  const db = await connectToDatabase();
  const collection = db.collection('deals');
  
  try {
    const result = await collection.insertMany(deals);
    console.log(`${result.insertedCount} deals inserted successfully`);
    return result;
  } catch (error) {
    console.error('Error inserting deals:', error);
    throw error;
  }
}

// Insert sales into database
async function insertSales(sales) {
  const db = await connectToDatabase();
  const collection = db.collection('sales');
  
  try {
    const result = await collection.insertMany(sales);
    console.log(`${result.insertedCount} sales inserted successfully`);
    return result;
  } catch (error) {
    console.error('Error inserting sales:', error);
    throw error;
  }
}

// Find all best discount deals (sorted by discount percentage)
async function findBestDiscountDeals(limit = 10) {
  const db = await connectToDatabase();
  const collection = db.collection('deals');
  
  try {
    const deals = await collection.find()
      .sort({ discountPercentage: -1 }) // Sort by discount percentage in descending order
      .limit(limit)
      .toArray();
    return deals;
  } catch (error) {
    console.error('Error finding best discount deals:', error);
    throw error;
  }
}

// Find all most commented deals
async function findMostCommentedDeals(limit = 10) {
  const db = await connectToDatabase();
  const collection = db.collection('deals');
  
  try {
    const deals = await collection.find()
      .sort({ commentCount: -1 }) // Sort by comment count in descending order
      .limit(limit)
      .toArray();
    return deals;
  } catch (error) {
    console.error('Error finding most commented deals:', error);
    throw error;
  }
}

// Find all deals sorted by price (low to high)
async function findDealsSortedByPrice(ascending = true, limit = 50) {
  const db = await connectToDatabase();
  const collection = db.collection('deals');
  
  const sortDirection = ascending ? 1 : -1;
  
  try {
    const deals = await collection.find()
      .sort({ price: sortDirection })
      .limit(limit)
      .toArray();
    return deals;
  } catch (error) {
    console.error('Error finding deals sorted by price:', error);
    throw error;
  }
}

// Find all deals sorted by date (newest first)
async function findDealsSortedByDate(limit = 50) {
  const db = await connectToDatabase();
  const collection = db.collection('deals');
  
  try {
    const deals = await collection.find()
      .sort({ date: -1 }) // Sort by date in descending order (newest first)
      .limit(limit)
      .toArray();
    return deals;
  } catch (error) {
    console.error('Error finding deals sorted by date:', error);
    throw error;
  }
}

// Find all sales for a given lego set id
async function findSalesByLegoSetId(legoSetId) {
  const db = await connectToDatabase();
  const collection = db.collection('sales');
  
  try {
    const sales = await collection.find({ legoSetId }).toArray();
    return sales;
  } catch (error) {
    console.error(`Error finding sales for Lego set ID ${legoSetId}:`, error);
    throw error;
  }
}

// Find all sales scraped less than 3 weeks ago
async function findRecentSales(weeksAgo = 3) {
  const db = await connectToDatabase();
  const collection = db.collection('sales');
  
  // Calculate date 3 weeks ago
  const threeWeeksAgo = new Date();
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - (weeksAgo * 7));
  
  try {
    const sales = await collection.find({ 
      scrapedDate: { $gte: threeWeeksAgo } 
    }).toArray();
    return sales;
  } catch (error) {
    console.error('Error finding recent sales:', error);
    throw error;
  }
}

module.exports = {
  insertDeals,
  insertSales,
  findBestDiscountDeals,
  findMostCommentedDeals,
  findDealsSortedByPrice,
  findDealsSortedByDate,
  findSalesByLegoSetId,
  findRecentSales
};