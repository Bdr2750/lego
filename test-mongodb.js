// test-mongodb.js
const { connectToDatabase, closeDatabaseConnection } = require('./database');
const dealService = require('./dealService');

// Example deals and sales data (replace with your actual scraped data)
const exampleDeals = [
  {
    title: 'LEGO Star Wars AT-AT 75313',
    price: 699.99,
    discountPercentage: 20,
    commentCount: 42,
    date: new Date('2023-02-15'),
    legoSetId: '75313'
  },
  {
    title: 'LEGO Technic Ferrari Daytona SP3 42143',
    price: 449.99,
    discountPercentage: 15,
    commentCount: 28,
    date: new Date('2023-03-01'),
    legoSetId: '42143'
  },
  {
    title: 'LEGO Icons Orchid 10311',
    price: 49.99,
    discountPercentage: 25,
    commentCount: 56,
    date: new Date('2023-02-20'),
    legoSetId: '10311'
  }
];

const exampleSales = [
  {
    legoSetId: '75313',
    retailer: 'Amazon',
    price: 559.99,
    link: 'https://amazon.com/dp/B09BNSQ6DD',
    scrapedDate: new Date()
  },
  {
    legoSetId: '42143',
    retailer: 'Walmart',
    price: 382.49,
    link: 'https://walmart.com/ip/123456',
    scrapedDate: new Date()
  },
  {
    legoSetId: '10311',
    retailer: 'Target',
    price: 37.49,
    link: 'https://target.com/p/987654',
    scrapedDate: new Date()
  }
];

async function main() {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Insert deals and sales
    await dealService.insertDeals(exampleDeals);
    await dealService.insertSales(exampleSales);
    
    // Query examples
    console.log('\nFinding best discount deals:');
    const bestDiscountDeals = await dealService.findBestDiscountDeals(5);
    console.log(bestDiscountDeals);
    
    console.log('\nFinding most commented deals:');
    const mostCommentedDeals = await dealService.findMostCommentedDeals(5);
    console.log(mostCommentedDeals);
    
    console.log('\nFinding deals sorted by price:');
    const dealsByPrice = await dealService.findDealsSortedByPrice(true, 5);
    console.log(dealsByPrice);
    
    console.log('\nFinding deals sorted by date:');
    const dealsByDate = await dealService.findDealsSortedByDate(5);
    console.log(dealsByDate);
    
    console.log('\nFinding sales for LEGO set 75313:');
    const salesBySetId = await dealService.findSalesByLegoSetId('75313');
    console.log(salesBySetId);
    
    console.log('\nFinding recent sales (last 3 weeks):');
    const recentSales = await dealService.findRecentSales();
    console.log(recentSales);
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the database connection
    await closeDatabaseConnection();
  }
}

main();