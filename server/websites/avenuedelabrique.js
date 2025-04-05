const httpClient = require('node-fetch');
const htmlParser = require('cheerio');

/**
 * Extracts product information from HTML document
 * @param {String} htmlContent - Raw HTML content from website
 * @return {Array} Collection of product information objects
 */
const extractProductData = htmlContent => {
  const document = htmlParser.load(htmlContent, {
    'xmlMode': true
  });
  
  return document('div.prods a')
    .map((index, productElement) => {
      // Extract and convert price to number
      const productPrice = parseFloat(
        document(productElement)
          .find('span.prodl-prix span')
          .text()
      );
      
      // Extract discount percentage and ensure positive value
      const discountPercentage = Math.abs(parseInt(
        document(productElement)
          .find('span.prodl-reduc')
          .text()
      ));
      
      // Return structured product data
      return {
        discountPercentage,
        productPrice,
        'productName': document(productElement).attr('title'),
      };
    })
    .get();
};

/**
 * Retrieves and processes product information from specified website
 * @param {String} targetUrl - Website URL to retrieve data from
 * @returns {Array|null} Collection of product data or null if retrieval fails
 */
module.exports.scrape = async targetUrl => {
  try {
    // Fetch webpage content
    const httpResponse = await httpClient(targetUrl);
    
    // Process successful responses
    if (httpResponse.status === 200) {
      const pageContent = await httpResponse.text();
      return extractProductData(pageContent);
    }
    
    // Log failed responses
    console.error('Failed to retrieve data:', httpResponse.status, httpResponse.statusText);
    return null;
  } catch (error) {
    // Handle network or parsing errors
    console.error('Error during scraping operation:', error.message);
    return null;
  }
};