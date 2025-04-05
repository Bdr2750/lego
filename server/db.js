require('dotenv').config({ path: './config.env' });
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Database configuration
const config = {
    MONGODB_URI: process.env.MONGODB_URI,
    DB_NAME: process.env.MONGODB_DB_NAME
};

// Query methods
const queryMethods = {
    findBestDiscountDeals: async (db, limit = 5) => {
        return db.collection('deals')
            .find()
            .sort({ price: -1 })
            .limit(limit)
            .toArray();
    },

    findMostCommentedDeals: async (db, limit = 5) => {
        return db.collection('deals')
            .find()
            .sort({ commentsCount: -1 })
            .limit(limit)
            .toArray();
    },

    findDealsSortedByPrice: async (db) => {
        return db.collection('deals')
            .find()
            .sort({ price: 1 })
            .toArray();
    },

    findDealsSortedByDate: async (db) => {
        return db.collection('sales')
            .find()
            .sort({ scrapedDate: -1 })
            .toArray();
    },

    findSalesByLegoSetId: async (db, legoSetId) => {
        return db.collection('sales')
            .find({ legoSetId })
            .toArray();
    },

    findRecentSales: async (db) => {
        const threeWeeksAgo = new Date(Date.now() - (21 * 24 * 60 * 60 * 1000));
        return db.collection('sales')
            .find({ scrapedDate: { $gte: threeWeeksAgo.toISOString() } })
            .toArray();
    }
};

// Enhanced Lego Set ID extraction
function extractLegoSetId(title) {
    const patterns = [
        /Set\s+(\d{4,5})\b/i,
        /#(\d{4,5})\b/,
        /\b(\d{5})\b/,
        /\b(\d{4})\b/
    ];

    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) return match[1];
    }
    return 'UNKNOWN';
}

async function initializeData(db) {
    let deals = JSON.parse(fs.readFileSync('./dealabs_results.json', 'utf-8'));

    // Add test data for Lego 42156 (temporary)
    deals.push({
        title: "LEGO Technic Porsche 911 RSR 42096 Building Kit #42156",
        price: 149.99,
        temperature: 200,
        commentsCount: 15,
        freeShipping: false,
        imageUrl: "https://example.com/42156.jpg",
        link: "https://example.com/lego-42156",
        source: "dealabs"
    });

    const salesData = deals.map(deal => ({
        ...deal,
        scrapedDate: new Date().toISOString(),
        legoSetId: extractLegoSetId(deal.title)
    }));

    await db.collection('deals').deleteMany({});
    await db.collection('sales').deleteMany({});
    
    await db.collection('deals').insertMany(deals);
    await db.collection('sales').insertMany(salesData);
}

async function main() {
    const client = new MongoClient(config.MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db(config.DB_NAME);

        await initializeData(db);

        // Execute all queries
        console.log('\n=== Best Discount Deals ===');
        console.log(await queryMethods.findBestDiscountDeals(db));

        console.log('\n=== Most Commented Deals ===');
        console.log(await queryMethods.findMostCommentedDeals(db));

        console.log('\n=== Deals Sorted by Price ===');
        console.log(await queryMethods.findDealsSortedByPrice(db));

        console.log('\n=== Deals Sorted by Date ===');
        console.log(await queryMethods.findDealsSortedByDate(db));

        console.log('\n=== Sales for Lego Set 42156 ===');
        console.log(await queryMethods.findSalesByLegoSetId(db, '42156'));

        console.log('\n=== Recent Sales (Last 3 Weeks) ===');
        console.log(await queryMethods.findRecentSales(db));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

main();