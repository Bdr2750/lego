const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises; 

// Enable stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Helper function to create a delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Resolves after the specified delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean up price data from text
 * @param {String} priceText - Price text to clean
 * @returns {Number|null} Cleaned price or null
 */
const extractPrice = (priceText) => {
  if (!priceText) return null;

  // Match the first valid number (integer or decimal)
  const priceMatch = priceText.match(/(\d+([.,]\d+)?)/);
  if (!priceMatch) return null;

  const sanitized = priceMatch[0].replace(',', '.');
  const price = parseFloat(sanitized);
  return isNaN(price) ? null : price;
};

/**
 * Parse Dealabs data from search results
 * @param {String} html - HTML content
 * @returns {Array} Extracted product data
 */
const parseDealabs = (html) => {
  const $ = cheerio.load(html);
  
  return $('.threadListCard')
    .map((i, element) => {
      const titleElement = $(element).find('.cept-tt.thread-link');
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');

      const priceElement = $(element).find('.thread-price');
      let priceText = priceElement.length ? priceElement.text().trim() : '';
      let price = extractPrice(priceText);

      // Skip items without price
      if (!price) return undefined;

      const temperatureElement = $(element).find('.cept-vote-temp');
      const temperatureText = temperatureElement.text().trim();
      const temperature = temperatureText ? parseInt(temperatureText.replace('°', '')) : 0;

      const commentsElement = $(element).find('a[title="Commentaires"]');
      const commentsText = commentsElement.text().trim();
      const commentsCount = commentsText ? parseInt(commentsText) : 0;

      const imageElement = $(element).find('.threadListCard-image img');
      let imageUrl = '';
      const srcset = imageElement.attr('srcset');
      if (srcset) {
        const srcsetOptions = srcset.split(',').map(opt => opt.trim());
        const highestRes = srcsetOptions.reduce((prev, curr) => {
          const currRes = parseInt(curr.match(/(\d+)x\d+/)?.[1] || 0);
          const prevRes = parseInt(prev.match(/(\d+)x\d+/)?.[1] || 0);
          return currRes > prevRes ? curr : prev;
        }, srcsetOptions[0]);
        imageUrl = highestRes.split(' ')[0];
      } else {
        imageUrl = imageElement.attr('src') || '';
      }

      // Process shipping info
      const shippingElement = $(element).find('.icon--truck').parent().find('.overflow--wrap-off');
      const shippingText = shippingElement.text().trim();
      const freeShipping = shippingText.toLowerCase().includes('gratuit');

      return {
        title,
        price,
        temperature,
        commentsCount,
        freeShipping,
        imageUrl,
        link: link.startsWith('http') ? link : `https://www.dealabs.com${link}`,
        source: 'dealabs'
      };
    })
    .get()
    .filter(item => item !== undefined);
};

/**
 * Parse Vinted data
 * @param {String} html - HTML content
 * @returns {Array} Extracted product data
 */
const parseVinted = (html) => {
  const $ = cheerio.load(html);
  
  return $('.feed-grid__item')
    .map((i, element) => {
      const titleElement = $(element).find('.ItemBox__title');
      const title = titleElement.text().trim();
      
      const priceElement = $(element).find('.ItemBox__price');
      let priceText = priceElement.length ? priceElement.text().trim() : '';
      let price = extractPrice(priceText);

      // Skip items without price
      if (!price) return undefined;

      const linkElement = $(element).find('a.ItemBox__overlay');
      const link = linkElement.attr('href');

      const imageElement = $(element).find('.ItemBox__image img');
      const imageUrl = imageElement.attr('src') || '';

      // Extract size info if available
      const sizeElement = $(element).find('.ItemBox__details .details-list__item:first-child');
      const size = sizeElement.length ? sizeElement.text().trim() : '';

      // Extract brand info if available
      const brandElement = $(element).find('.ItemBox__details .details-list__item:nth-child(2)');
      const brand = brandElement.length ? brandElement.text().trim() : '';

      return {
        title,
        price,
        size,
        brand,
        imageUrl,
        link: link.startsWith('http') ? link : `https://www.vinted.fr${link}`,
        source: 'vinted'
      };
    })
    .get()
    .filter(item => item !== undefined);
};

/**
 * Scrape with basic fetch for simpler sites
 * @param {String} url - URL to scrape
 * @param {String} site - Site name to determine parse function
 * @returns {Array|null} Scraped data or null on error
 */
async function basicScrape(url, site) {
  try {
    console.log(`Fetching content from: ${url}`);
    const response = await fetch(url);
    
    if (response.status === 200) {
      const content = await response.text();
      console.log("Content fetched successfully, extracting data...");
      
      switch (site) {
        case 'dealabs':
          return parseDealabs(content);
        case 'vinted':
          return parseVinted(content);
        default:
          console.error(`Unknown site: ${site}`);
          return null;
      }
    }
    
    console.error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    return null;
  } catch (error) {
    console.error(`Error during scraping: ${error.message}`);
    return null;
  }
}

/**
 * Advanced scrape with Puppeteer for sites with dynamic content
 * @param {String} url - URL to scrape
 * @param {String} site - Site name to determine parse function
 * @returns {Array|null} Scraped data or null on error
 */
async function advancedScrape(url, site) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`Starting puppeteer scrape of ${url} (attempt ${attempt + 1}/${maxRetries})`);
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
      });

      console.log("Navigating to page...");
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await sleep(3000);

      try {
        console.log("Checking for cookie consent...");
        const cookieSelector = '[id*="cookie"] button, [class*="cookie"] button, [id*="consent"] button';
        const cookieButton = await page.$(cookieSelector);
        if (cookieButton) {
          await cookieButton.click();
          await sleep(1000);
        }
      } catch (e) {
        console.log('No cookie banner or error handling it:', e.message);
      }

      console.log("Waiting for content to load...");
      if (site === 'dealabs') {
        await page.waitForSelector('.threadListCard', { timeout: 30000 });
      } else if (site === 'vinted') {
        await page.waitForSelector('.feed-grid__item', { timeout: 30000 });
      }

      console.log("Extracting page content...");
      const content = await page.content();
      await browser.close();
      console.log("Browser closed.");

      let results;
      switch (site) {
        case 'dealabs':
          results = parseDealabs(content);
          break;
        case 'vinted':
          results = parseVinted(content);
          break;
        default:
          console.error(`Unknown site: ${site}`);
          return null;
      }

      if (results && results.length > 0) {
        return results;
      } else {
        throw new Error(`No products found for ${site}`);
      }
    } catch (e) {
      attempt++;
      console.error(`❌ Attempt ${attempt} failed: ${e.message}`);

      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} attempts failed`);
        return null;
      }

      await sleep(2000 * attempt);
    }
  }

  return null;
}

/**
 * Determine which scraping method to use based on site
 * @param {String} url - URL to scrape
 * @returns {Array|null} Scraped data or null on error
 */
async function scrape(url) {
  if (!url) {
    console.error('No URL provided');
    return null;
  }

  let site = '';
  if (url.includes('dealabs.com')) {
    site = 'dealabs';
  } else if (url.includes('vinted.fr')) {
    site = 'vinted';
  } else {
    console.error('Unsupported website. Please provide a URL from dealabs.com or vinted.fr');
    return null;
  }

  // Use advanced scraping for sites with dynamic content
  return await advancedScrape(url, site);
}

/**
 * Main function to run tests for different sites
 */
async function runTests() {
  console.log("==== Testing Dealabs Scraper ====");
  const dealabsUrl = "https://www.dealabs.com/search?q=promotions";
  console.log(`Testing URL: ${dealabsUrl}`);
  const dealabsResults = await scrape(dealabsUrl);
  
  if (dealabsResults && dealabsResults.length > 0) {
    console.log(`\n✅ Found ${dealabsResults.length} deals on Dealabs`);
    console.log("\nSample data (first 3 items):");
    dealabsResults.slice(0, 3).forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Temperature: ${item.temperature}°`);
      console.log(`  Comments: ${item.commentsCount}`);
      console.log(`  Free Shipping: ${item.freeShipping ? 'Yes' : 'No'}`);
      console.log(`  Link: ${item.link}`);
    });
  } else {
    console.log("❌ No deals found on Dealabs or scraping failed");
  }

  console.log("\n\n==== Testing Vinted Scraper ====");
  const vintedUrl = "https://www.vinted.fr/vetements?search_text=vetements";
  console.log(`Testing URL: ${vintedUrl}`);
  const vintedResults = await scrape(vintedUrl);
  
  if (vintedResults && vintedResults.length > 0) {
    console.log(`\n✅ Found ${vintedResults.length} items on Vinted`);
    console.log("\nSample data (first 3 items):");
    vintedResults.slice(0, 3).forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Size: ${item.size || 'N/A'}`);
      console.log(`  Brand: ${item.brand || 'N/A'}`);
      console.log(`  Link: ${item.link}`);
    });
  } else {
    console.log("❌ No items found on Vinted or scraping failed");
  }
}

// Run the tests
runTests();
async function runTests() {
  console.log("==== Testing Dealabs Scraper ====");
  const dealabsUrl = "https://www.dealabs.com/search?q=promotions";
  console.log(`Testing URL: ${dealabsUrl}`);
  const dealabsResults = await scrape(dealabsUrl);
  
  if (dealabsResults && dealabsResults.length > 0) {
    console.log(`\n✅ Found ${dealabsResults.length} deals on Dealabs`);
    
    // Save Dealabs results
    try {
      await fs.writeFile('dealabs_results.json', JSON.stringify(dealabsResults, null, 2));
      console.log('Saved to dealabs_results.json');
    } catch (err) {
      console.error('Error saving Dealabs results:', err);
    }

    console.log("\nSample data (first 3 items):");
    dealabsResults.slice(0, 3).forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Temperature: ${item.temperature}°`);
      console.log(`  Comments: ${item.commentsCount}`);
      console.log(`  Free Shipping: ${item.freeShipping ? 'Yes' : 'No'}`);
      console.log(`  Link: ${item.link}`);
    });
  }

  console.log("\n\n==== Testing Vinted Scraper ====");
  const vintedUrl = "https://www.vinted.fr/vetements?search_text=vetements";
  console.log(`Testing URL: ${vintedUrl}`);
  const vintedResults = await scrape(vintedUrl);
  
  if (vintedResults && vintedResults.length > 0) {
    console.log(`\n✅ Found ${vintedResults.length} items on Vinted`);
    
    // Save Vinted results
    try {
      await fs.writeFile('vinted_results.json', JSON.stringify(vintedResults, null, 2));
      console.log('Saved to vinted_results.json');
    } catch (err) {
      console.error('Error saving Vinted results:', err);
    }

    console.log("\nSample data (first 3 items):");
    vintedResults.slice(0, 3).forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  Title: ${item.title}`);
      console.log(`  Price: ${item.price}`);
      console.log(`  Size: ${item.size || 'N/A'}`);
      console.log(`  Brand: ${item.brand || 'N/A'}`);
      console.log(`  Link: ${item.link}`);
    });
  }
}