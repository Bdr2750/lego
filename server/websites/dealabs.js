const puppeteerCore = require('puppeteer-extra');
const AntiDetectionPlugin = require('puppeteer-extra-plugin-stealth');
const $ = require('cheerio');
const fileSystem = require('fs').promises;
const filePath = require('path');

// Apply anti-detection plugin to enhance browser stealth
puppeteerCore.use(AntiDetectionPlugin());

/**
 * Creates a promise that resolves after a specified time
 * @param {number} milliseconds - Time to wait in milliseconds
 * @returns {Promise} Promise that resolves after the delay
 */
const sleep = (milliseconds) => new Promise(r => setTimeout(r, milliseconds));

/**
 * Attempts to find and extract a LEGO set number from text or URL
 * @param {String} content - Text content (typically title)
 * @param {String} pageUrl - URL that might contain set number
 * @returns {String|null} Extracted LEGO set number or null
 */
const findLegoSetNumber = (content, pageUrl = '') => {
  // Check for numbers in parentheses first (common LEGO set number format)
  const numbersInParentheses = content.match(/\(\d{4,6}\)/);
  if (numbersInParentheses) {
    const candidate = numbersInParentheses[0].replace(/[()]/g, '');
    if (candidate.length >= 4 && candidate.length <= 6) {
      return candidate;
    }
  }

  // Look for standalone 4-6 digit numbers in content
  const numberMatches = content.match(/\b\d{4,6}\b/g);
  if (numberMatches) {
    // Avoid misidentifying piece counts as set numbers
    for (const potentialSetNumber of numberMatches) {
      if (!content.toLowerCase().includes(`${potentialSetNumber} pièces`)) {
        return potentialSetNumber;
      }
    }
  }

  // Try extracting from URL as last resort
  const urlNumberMatches = pageUrl.match(/\b\d{4,6}\b/g);
  if (urlNumberMatches) {
    return urlNumberMatches[0];
  }

  return null;
};

/**
 * Extracts and normalizes price information from text
 * @param {String} rawPrice - Price text with potential formatting
 * @returns {Number|null} Normalized price as float or null
 */
const normalizePrice = (rawPrice) => {
  if (!rawPrice) return null;

  // Extract first valid number pattern
  const priceRegex = rawPrice.match(/(\d+([.,]\d+)?)/);
  if (!priceRegex) return null;

  // Convert comma decimal separator to period
  const normalized = priceRegex[0].replace(',', '.');
  const numericPrice = parseFloat(normalized);
  return isNaN(numericPrice) ? null : numericPrice;
};

/**
 * Converts relative time expressions into date objects
 * @param {String} timeString - Relative time expression (e.g. "il y a 3 h")
 * @returns {Date|null} Calculated date or null if invalid
 */
const convertRelativeTimeToDate = (timeString) => {
  if (!timeString) return null;

  // Extract time components using regex
  const dayMatch = timeString.match(/(\d+)\s*j/);
  const hourMatch = timeString.match(/(\d+)\s*h/);
  const minuteMatch = timeString.match(/(\d+)\s*min/);

  const dayCount = dayMatch ? parseInt(dayMatch[1]) : 0;
  const hourCount = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minuteCount = minuteMatch ? parseInt(minuteMatch[1]) : 0;

  // Return null if no time components found
  if (dayCount === 0 && hourCount === 0 && minuteCount === 0) return null;

  // Calculate date by subtracting time components from current time
  const currentTime = new Date();
  const calculatedDate = new Date(currentTime);
  calculatedDate.setDate(calculatedDate.getDate() - dayCount);
  calculatedDate.setHours(calculatedDate.getHours() - hourCount);
  calculatedDate.setMinutes(calculatedDate.getMinutes() - minuteCount);

  return calculatedDate;
};

/**
 * Processes HTML from search results to extract LEGO deals
 * @param {String} htmlContent - HTML content from search page
 * @return {Array} Collection of extracted deal objects
 */
const extractSearchListings = (htmlContent) => {
  const webpage = $.load(htmlContent);

  // Extract thread publication dates from structured data if available
  let threadDates = {};
  const structuredDataScript = webpage('script[type="application/ld+json"]').html();
  if (structuredDataScript) {
    try {
      const structuredData = JSON.parse(structuredDataScript);
      const forumThreads = structuredData['@graph']?.filter(item => item['@type'] === 'DiscussionForumPosting') || [];
      forumThreads.forEach(thread => {
        const idMatch = thread.url?.match(/\/(\d+)$/);
        if (idMatch && thread.datePublished) {
          const threadId = idMatch[1];
          threadDates[threadId] = new Date(thread.datePublished);
        }
      });
    } catch (e) {
      console.warn('Failed to process JSON-LD structured data:', e.message);
    }
  }

  return webpage('.threadListCard')
    .map((i, element) => {
      const titleLink = webpage(element).find('.cept-tt.thread-link');
      const titleText = titleLink.text().trim();
      const dealUrl = titleLink.attr('href');

      // Skip non-LEGO deals
      if (!titleText.toLowerCase().includes('lego')) return undefined;

      const setNumber = findLegoSetNumber(titleText, dealUrl);

      const priceElem = webpage(element).find('.thread-price');
      let priceText = priceElem.length ? priceElem.text().trim() : '';
      let dealPrice = normalizePrice(priceText);

      // Skip deals without price information
      if (!dealPrice) return undefined;

      const ratingElem = webpage(element).find('.cept-vote-temp');
      const ratingText = ratingElem.text().trim();
      const dealRating = ratingText ? parseInt(ratingText.replace('°', '')) : 0;

      // Determine post date using thread ID or relative time
      let postDate = null;
      const threadIdMatch = dealUrl.match(/\/(\d+)$/);
      if (threadIdMatch && threadDates[threadIdMatch[1]]) {
        postDate = threadDates[threadIdMatch[1]];
      } else {
        const timeElem = webpage(element).find('.chip--type-default .size--all-s');
        const timeText = timeElem.text().trim() || '';
        const calculatedDate = convertRelativeTimeToDate(timeText);
        if (calculatedDate) {
          postDate = calculatedDate;
        }
      }

      // Handle shipping information
      const shippingElem = webpage(element).find('.icon--truck').parent().find('.overflow--wrap-off');
      const shippingText = shippingElem.text().trim();
      const hasNoShippingCost = shippingText.toLowerCase().includes('gratuit');
      if (!hasNoShippingCost && shippingText) {
        const shippingCost = normalizePrice(shippingText);
        if (shippingCost) {
          dealPrice += shippingCost; // Include shipping in total price
        }
      }

      // Extract comment count
      const commentElem = webpage(element).find('a[title="Commentaires"]');
      const commentText = commentElem.text().trim();
      const commentCount = commentText ? parseInt(commentText) : 0;

      // Get highest resolution product image
      const imgElem = webpage(element).find('.threadListCard-image img');
      let productImage = '';
      const srcsetAttr = imgElem.attr('srcset');
      if (srcsetAttr) {
        const srcsetOptions = srcsetAttr.split(',').map(opt => opt.trim());
        const bestQualityOption = srcsetOptions.reduce((best, current) => {
          const currentRes = parseInt(current.match(/(\d+)x\d+/)?.[1] || 0);
          const bestRes = parseInt(best.match(/(\d+)x\d+/)?.[1] || 0);
          return currentRes > bestRes ? current : best;
        }, srcsetOptions[0]);
        productImage = bestQualityOption.split(' ')[0];
      } else {
        productImage = imgElem.attr('src') || '';
      }

      return {
        setNumber,
        title: titleText,
        price: dealPrice,
        link: dealUrl.startsWith('http') ? dealUrl : `https://www.dealabs.com${dealUrl}`,
        temperature: dealRating,
        postedDate: postDate ? postDate.toISOString() : null,
        freeShipping: hasNoShippingCost,
        commentsCount: commentCount,
        imageUrl: productImage,
      };
    })
    .get()
    .filter(item => item !== undefined);
};

/**
 * Processes HTML from individual deal pages to extract LEGO deal details
 * @param {String} htmlContent - HTML content from product page
 * @param {String} pageUrl - URL of the deal page
 * @return {Array} Array containing the extracted deal (or empty)
 */
const extractDealDetails = (htmlContent, pageUrl) => {
  const webpage = $.load(htmlContent);

  const titleElem = webpage('.thread-title span') || webpage('h1');
  const titleText = titleElem.text().trim() || webpage('title').text().trim();

  // Skip non-LEGO deals
  if (!titleText.toLowerCase().includes('lego')) return [];

  const setNumber = findLegoSetNumber(titleText, pageUrl);

  const priceElem = webpage('.thread-price, .threadItemCard-price');
  let priceText = priceElem.text().trim();
  let dealPrice = normalizePrice(priceText);

  const ratingElem = webpage('.cept-vote-temp');
  const ratingText = ratingElem.text().trim();
  const dealRating = ratingText ? parseInt(ratingText.replace('°', '')) : 0;

  // Parse timestamp from title attribute
  const timeElem = webpage('.size--all-s.color--text-TranslucentSecondary[title]');
  const timestampText = timeElem.attr('title') || '';
  let postDate = null;

  if (timestampText) {
    const frenchMonths = {
      'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
      'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };
    const dateMatch = timestampText.match(/(\d+)\s*(\w+)\s*(\d+),\s*(\d+):(\d+):(\d+)/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = frenchMonths[dateMatch[2].toLowerCase()];
      const year = parseInt(dateMatch[3]);
      const hours = parseInt(dateMatch[4]);
      const minutes = parseInt(dateMatch[5]);
      const seconds = parseInt(dateMatch[6]);
      postDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    }
  }

  // Handle shipping information
  const shippingElem = webpage('.icon--truck').parent().find('.overflow--wrap-off');
  const shippingText = shippingElem.text().trim();
  const hasNoShippingCost = shippingText.toLowerCase().includes('gratuit');
  if (!hasNoShippingCost && shippingText) {
    const shippingCost = normalizePrice(shippingText);
    if (shippingCost) {
      dealPrice = dealPrice ? dealPrice + shippingCost : shippingCost;
    }
  }

  // Extract comment count
  const commentElem = webpage('h2.flex--inline.boxAlign-ai--all-c span.size--all-l, h2.flex--inline.boxAlign-ai--all-c span.size--fromW3-xl');
  const commentText = commentElem.first().text().trim();
  const commentMatch = commentText.match(/(\d+)\s*commentaires/);
  let commentCount = commentMatch ? parseInt(commentMatch[1]) : 0;

  // Try to get comment count from JSON-LD if not found in HTML
  if (commentCount === 0) {
    const structuredDataScript = webpage('script[type="application/ld+json"]').html();
    if (structuredDataScript) {
      try {
        const structuredData = JSON.parse(structuredDataScript);
        const stats = structuredData['@type'] === 'DiscussionForumPosting' 
          ? structuredData.interactionStatistic 
          : structuredData['@graph']?.find(item => item['@type'] === 'DiscussionForumPosting')?.interactionStatistic;
        
        if (stats && Array.isArray(stats)) {
          const commentStat = stats.find(stat => stat.interactionType['@type'] === 'https://schema.org/CommentAction');
          if (commentStat) {
            commentCount = commentStat.userInteractionCount || 0;
          }
        }
      } catch (e) {
        console.warn('Failed to extract comment count from JSON-LD:', e.message);
      }
    }
  }

  // Get product image
  const imageElem = webpage('.thread-image, .carousel-thumbnail-img, .threadItemCard-img picture');
  let productImage = '';
  const sourceElem = imageElem.find('source[media="(min-width: 768px)"]');
  if (sourceElem.length) {
    productImage = sourceElem.attr('srcset') || '';
  } else {
    const imgElem = imageElem.find('img').first();
    productImage = imgElem.attr('src') || '';
  }

  return [{
    setNumber,
    title: titleText,
    price: dealPrice,
    link: pageUrl,
    temperature: dealRating,
    postedDate: postDate ? postDate.toISOString() : null,
    freeShipping: hasNoShippingCost,
    commentsCount: commentCount,
    imageUrl: productImage,
  }];
};

/**
 * Persists deal data to JSON file, updating existing entries as needed
 * @param {Array} deals - New deals to save
 * @param {String} outputPath - Path to save deals JSON file
 * @param {boolean} isDetailPage - Whether deals come from a detail page
 */
const persistDeals = async (deals, outputPath, isDetailPage) => {
  try {
    const directory = filePath.dirname(outputPath);
    await fileSystem.mkdir(directory, { recursive: true });

    // Load existing deals file if available
    let existingData = [];
    try {
      const fileContent = await fileSystem.readFile(outputPath, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch (err) {
      console.log(`Creating new deals database at ${outputPath}`);
    }

    // Create map for faster lookup of existing deals
    const dealMap = new Map();
    existingData.forEach(item => {
      if (item.link) {
        dealMap.set(item.link, item);
      }
    });

    // Update or add new deals
    deals.forEach(deal => {
      const dealId = deal.link;
      if (!dealId) return;

      if (dealMap.has(dealId)) {
        const existingIndex = existingData.findIndex(d => d.link === deal.link);
        if (existingIndex !== -1) {
          if (isDetailPage) {
            // Replace completely if from detail page
            existingData[existingIndex] = { ...deal };
          } else {
            // Only update dynamic properties if from search page
            existingData[existingIndex] = {
              ...existingData[existingIndex],
              temperature: deal.temperature,
              commentsCount: deal.commentsCount,
            };
          }
        }
      } else {
        // Add new deals to collection
        existingData.push(deal);
      }
    });

    // Write updated deals back to file
    await fileSystem.writeFile(outputPath, JSON.stringify(existingData, null, 2));
  } catch (error) {
    console.error(`❌ Failed to save deals: ${error.message}`);
  }
};

/**
 * Main scraper function that extracts LEGO deals from dealabs.com
 * @param {String} targetUrl - URL to scrape
 * @returns {Array} Collection of extracted deal objects
 */
module.exports.scrape = async (targetUrl) => {
  const maxAttempts = 3;
  let currentAttempt = 0;

  const isDealDetailPage = targetUrl.includes('/bons-plans/') && !targetUrl.includes('search');

  while (currentAttempt < maxAttempts) {
    try {
      // Initialize browser with stealth settings
      const browser = await puppeteerCore.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-dev-shm-usage',
        ],
      });

      // Setup browser page with anti-detection measures
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Add browser fingerprint evasion
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
      });

      // Navigate to target URL and wait for content to load
      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 120000 });
      await sleep(5000);

      // Handle cookie consent if present
      try {
        const cookieBannerSelector = '[id*="cookie"] button, [class*="cookie"] button, [id*="consent"] button';
        const cookieButton = await page.$(cookieBannerSelector);
        if (cookieButton) {
          await cookieButton.click();
          await sleep(1000);
        }
      } catch (e) {
        console.log('No cookie consent banner found or error handling it:', e.message);
      }

      let htmlContent;
      let extractedDeals = [];

      // Process content based on page type
      if (isDealDetailPage) {
        await page.waitForSelector('.threadItemCard-content, article[data-handler="history thread-click"]', { timeout: 30000 });
        htmlContent = await page.content();
        extractedDeals = extractDealDetails(htmlContent, targetUrl);
      } else {
        await page.waitForSelector('.threadListCard', { timeout: 90000 });
        htmlContent = await page.content();
        extractedDeals = extractSearchListings(htmlContent);
      }

      await browser.close();

      // Save results if valid
      if (extractedDeals.length > 0 || (isDealDetailPage && extractedDeals.length === 0)) {
        const outputPath = filePath.resolve(__dirname, '../../../data/deals_dealabs.json');
        await persistDeals(extractedDeals, outputPath, isDealDetailPage);
        return extractedDeals;
      } else {
        throw new Error('No qualifying LEGO deals found in the content');
      }
    } catch (e) {
      currentAttempt++;
      console.error(`❌ Attempt ${currentAttempt} failed for ${targetUrl}:`, e.message);

      if (currentAttempt === maxAttempts) {
        console.error(`❌ All ${maxAttempts} attempts failed for ${targetUrl}`);
        return [];
      }

      // Exponential backoff between retries
      await sleep(2000 * currentAttempt);
    }
  }

  return [];
};