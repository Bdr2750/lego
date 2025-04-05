const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanPrice = (priceText) => {
  if (!priceText) return null;
  const sanitized = priceText.replace(/[^\d,.]/g, '').replace(',', '.');
  return parseFloat(sanitized) || null;
};

const getCondition = (conditionText) => {
  const conditions = {
    'neuf avec étiquette': 'new_with_tags',
    'neuf sans étiquette': 'new_without_tags',
    'très bon état': 'very_good',
    'bon état': 'good',
    'état correct': 'fair'
  };
  return conditions[conditionText.toLowerCase()] || 'not_specified';
};

const parseSearchResults = (html) => {
  const $ = cheerio.load(html);
  const items = [];

  $('[data-testid="serp-item"]').each((i, element) => {
    const card = $(element);
    const title = card.find('[data-testid="title"]').text().trim();
    const price = cleanPrice(card.find('[data-testid="price"]').text().trim());
    const url = `https://www.vinted.fr${card.find('a').attr('href')}`;
    const image = card.find('img').attr('src');
    const condition = getCondition(card.find('[data-testid="item-condition"]').text().trim());
    const favorites = parseInt(card.find('[data-testid="favorites-count"]').text().trim()) || 0;

    items.push({
      title,
      price,
      url,
      image,
      condition,
      favorites,
      platform: 'vinted'
    });
  });

  return items;
};

const parseProductPage = (html, url) => {
  const $ = cheerio.load(html);
  const details = {
    title: $('h1').text().trim(),
    price: cleanPrice($('[data-testid="price-text"]').text().trim()),
    description: $('[data-testid="description-text"]').text().trim(),
    images: [],
    condition: getCondition($('[data-testid="item-condition"]').text().trim()),
    favorites: parseInt($('[data-testid="favorites-count"]').text().trim()) || 0,
    url,
    platform: 'vinted'
  };

  $('[data-testid="image-container"] img').each((i, img) => {
    details.images.push($(img).attr('src'));
  });

  return [details];
};

const saveResults = async (items, filePath) => {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    let existing = [];
    try {
      existing = JSON.parse(await fs.readFile(filePath, 'utf8'));
    } catch (err) {
      console.log(`Creating new file at ${filePath}`);
    }

    const merged = [...existing];
    items.forEach(newItem => {
      if (!merged.some(existingItem => existingItem.url === newItem.url)) {
        merged.push(newItem);
      }
    });

    await fs.writeFile(filePath, JSON.stringify(merged, null, 2));
  } catch (error) {
    console.error('Save error:', error.message);
  }
};

module.exports.scrape = async (url) => {
  const isProductPage = url.includes('/items/');
  const maxRetries = 3;
  let attempts = 0;

  while (attempts < maxRetries) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080'
        ],
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      // Bypass bot detection
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
      });

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await delay(3000);

      // Cookie consent
      try {
        await page.click('[data-testid="cookie-policy-modal-accept"]');
        await delay(1000);
      } catch (e) {}

      // Scroll loading
      if (!isProductPage) {
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let scrollPosition = 0;
            const scrollStep = 500;
            const timer = setInterval(() => {
              window.scrollBy(0, scrollStep);
              scrollPosition += scrollStep;
              if (scrollPosition >= document.body.scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 800);
          });
        });
        await delay(2000);
      }

      const html = await page.content();
      const results = isProductPage ? parseProductPage(html, url) : parseSearchResults(html);

      if (results.length) {
        const filePath = path.resolve(__dirname, '../../../data/vinted_results.json');
        await saveResults(results, filePath);
        await browser.close();
        return results;
      }

      await browser.close();
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed: ${error.message}`);
      if (browser) await browser.close();
      if (attempts === maxRetries) {
        console.error(`All attempts failed for ${url}`);
        return [];
      }
      await delay(5000 * attempts);
    }
  }
  return [];
};