// File: scrapers/legoScraper.js
const parseDomain = require("parse-domain");
const websites = require('require-all')(`${__dirname}/../websites`);

const scrapeDeals = async (url) => {
  try {
    const { domain: website } = parseDomain(url);
    
    // Debug: Vérifiez le domaine parsé
    console.log("[SCRAPER] Domain parsed:", website);

    if (!websites[website]) {
      throw new Error(`Aucun scraper pour ${website}`);
    }

    const deals = await websites[website].scrape(url);
    return deals;
  } catch (error) {
    console.error("[SCRAPER] Erreur critique:", error.message);
    return []; // Évite les crashes
  }
};

module.exports = { scrapeDeals };