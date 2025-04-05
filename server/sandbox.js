/* eslint-disable no-console, no-process-exit */
const fs = require('fs').promises;
const path = require('path');
const dealabsScraper = require('./src/scrapers/websites/dealabs');
const vintedScraper = require('./src/scrapers/websites/vinted');
const briqueAvenueScraper = require('./src/scrapers/websites/avenuedelabrique');
const { initializeSpinner, updateSpinnerStatus, terminateSpinner } = require('./src/utils/spinner');

/**
 * Selects the appropriate scraper module based on target website
 * @param {string} targetUrl - Website URL to be processed
 * @returns {Object} The corresponding scraper module
 */
function selectScraperModule(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') {
    throw new Error('Invalid URL: Please provide a valid URL string');
  }
  
  if (targetUrl.includes('dealabs.com')) {
    return dealabsScraper;
  } else if (targetUrl.includes('vinted.fr')) {
    return vintedScraper;
  } else if (targetUrl.includes('avenuedelabrique.com')) {
    return briqueAvenueScraper;
  } else {
    throw new Error('Unsupported website. This tool currently works with dealabs.com, vinted.fr, and avenuedelabrique.com only');
  }
}

/**
 * Main function that coordinates the scraping process
 * @param {string} targetWebsite - URL to extract data from
 */
async function runScraper(targetWebsite) {
  try {
    if (!targetWebsite) {
      throw new Error('Missing URL parameter. Please specify a website to scrape');
    }
    
    await initializeSpinner(`🌐 Accessing ${targetWebsite}`);
    
    const scraperModule = selectScraperModule(targetWebsite);
    const scrapedResults = await scraperModule.scrape(targetWebsite);
    
    terminateSpinner();
    
    if (scrapedResults.length === 0) {
      console.log('No relevant data found at the provided URL.');
    } else {
      console.log('Extracted Information:');
      console.log(JSON.stringify(scrapedResults, null, 2)); // Format output with indentation
      
      // Save results to JSON file
      const dataDir = path.resolve(__dirname, 'data');
      await fs.mkdir(dataDir, { recursive: true }).catch(() => {});
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let source = 'unknown';
      if (targetWebsite.includes('dealabs.com')) source = 'dealabs';
      else if (targetWebsite.includes('vinted.fr')) source = 'vinted';
      else if (targetWebsite.includes('avenuedelabrique.com')) source = 'avenuedelabrique';
      
      const filename = `${source}_${timestamp}.json`;
      const filePath = path.join(dataDir, filename);
      
      await fs.writeFile(filePath, JSON.stringify(scrapedResults, null, 2));
      console.log(`Results saved to: ${filePath}`);
    }
    
    console.log('Process completed successfully ✅');
    process.exit(0);
  } catch (error) {
    terminateSpinner();
    console.error('Error encountered:', error.message);
    process.exit(1);
  }
}

// Extract URL from command line arguments
const [,, targetUrl] = process.argv;
runScraper(targetUrl);