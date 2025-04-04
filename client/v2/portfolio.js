// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let filteredDeals = null; // To keep track of filtered deals

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const selectLegoSetIds = document.querySelector('#lego-set-id-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const sectionSalesInfo = document.querySelector('#sales-info');

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({result, meta}) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return {currentDeals, currentPagination};
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return {currentDeals, currentPagination};
  }
};

/**
 * Fetch Vinted sales for a specific LEGO set ID
 * @param  {String} setId - LEGO set ID
 * @return {Array} Array of sales
 */
const fetchVintedSales = async (setId) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/sales?id=${setId}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return [];
    }

    return body.data.result;
  } catch (error) {
    console.error('Error fetching Vinted sales:', error);
    return [];
  }
};

/**
 * Extract unique set IDs from deals
 * @param  {Array} deals
 * @return {Array} Unique set IDs
 */
const getIdsFromDeals = (deals) => {
  const ids = deals.map(deal => deal.id.split('-')[0]);
  return [...new Set(ids)]; // Remove duplicates
};

/**
 * Calculate sales indicators
 * @param  {Array} sales - Array of sales
 * @return {Object} Object with indicators
 */
const calculateSalesIndicators = (sales) => {
  if (!sales || sales.length === 0) return null;
  
  // Extract prices and sort them
  const prices = sales.map(sale => parseFloat(sale.price));
  prices.sort((a, b) => a - b);
  
  // Calculate average
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = sum / prices.length;
  
  // Calculate percentiles
  const p5Index = Math.floor(prices.length * 0.05);
  const p25Index = Math.floor(prices.length * 0.25);
  const p50Index = Math.floor(prices.length * 0.5);
  
  const p5 = prices[p5Index];
  const p25 = prices[p25Index];
  const p50 = prices[p50Index]; // median
  
  // Calculate lifetime value (days between first and last sale)
  const dates = sales.map(sale => new Date(sale.date));
  const oldestDate = new Date(Math.min(...dates));
  const newestDate = new Date(Math.max(...dates));
  const lifetimeValue = Math.floor((newestDate - oldestDate) / (1000 * 60 * 60 * 24)); // in days
  
  return {
    total: sales.length,
    average,
    p5,
    p25,
    p50,
    lifetimeValue
  };
};

/**
 * Toggle favorite status for a deal
 * @param  {String} uuid - Deal UUID
 */
const toggleFavorite = (uuid) => {
  const index = favorites.indexOf(uuid);
  
  if (index === -1) {
    favorites.push(uuid);
  } else {
    favorites.splice(index, 1);
  }
  
  // Save to localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites));
  
  // Update UI
  const dealElement = document.getElementById(uuid);
  if (dealElement) {
    const favoriteBtn = dealElement.querySelector('.favorite-btn');
    favoriteBtn.classList.toggle('is-favorite');
    favoriteBtn.textContent = index === -1 ? '★' : '☆';
  }
};

/**
 * Check if a deal is a favorite
 * @param  {String} uuid - Deal UUID
 * @return {Boolean}
 */
const isFavorite = (uuid) => {
  return favorites.includes(uuid);
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = deals => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = deals
    .map(deal => {
      const favoriteStatus = isFavorite(deal.uuid) ? '★' : '☆';
      const favoriteClass = isFavorite(deal.uuid) ? 'is-favorite' : '';
      
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}" target="_blank" rel="noopener">${deal.title}</a>
        <span class="price">€${deal.price}</span>
        <div class="deal-details">
          <span class="discount">${deal.discount || 0}% off</span>
          <span class="temperature">${deal.temperature || 0}°</span>
          <span class="comments">${deal.comments || 0} comments</span>
          <span class="date">${new Date(deal.date).toLocaleDateString()}</span>
        </div>
        ${deal.soldUrl ? `<a href="${deal.soldUrl}" target="_blank" rel="noopener" class="sold-link">View Sold Item</a>` : ''}
        <button class="favorite-btn ${favoriteClass}" data-uuid="${deal.uuid}">${favoriteStatus}</button>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = '<h2>Deals</h2>';
  sectionDeals.appendChild(fragment);
  
  // Add event listeners to favorite buttons
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleFavorite(btn.dataset.uuid);
    });
  });
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} deals
 */
const renderLegoSetIds = deals => {
  const ids = getIdsFromDeals(deals);
  const options = ids.map(id => 
    `<option value="${id}">${id}</option>`
  ).join('');

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page indicators
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;
  spanNbDeals.innerHTML = count;
};

/**
 * Render sales information for a specific set
 * @param  {Array} sales
 * @param  {Object} indicators
 */
const renderSalesInfo = (sales, indicators) => {
  if (!indicators) {
    sectionSalesInfo.innerHTML = '<p>No sales data available for this set.</p>';
    return;
  }
  
  sectionSalesInfo.innerHTML = `
    <div class="sales-indicators">
      <h3>Sales Information</h3>
      <p>Total Sales: ${indicators.total}</p>
      <p>Average Price: €${indicators.average.toFixed(2)}</p>
      <p>P5 Price: €${indicators.p5.toFixed(2)}</p>
      <p>P25 Price: €${indicators.p25.toFixed(2)}</p>
      <p>P50 Price (Median): €${indicators.p50.toFixed(2)}</p>
      <p>Lifetime Value: ${indicators.lifetimeValue} days</p>
    </div>
  `;
};

/**
 * Render everything
 * @param  {Array} deals
 * @param  {Object} pagination
 */
const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

/**
 * Filter deals by discount (> 50%)
 * @param  {Array} deals
 * @return {Array} Filtered deals
 */
const filterByDiscount = (deals) => {
  return deals.filter(deal => deal.discount >= 50);
};

/**
 * Filter deals by comments (> 15)
 * @param  {Array} deals
 * @return {Array} Filtered deals
 */
const filterByComments = (deals) => {
  return deals.filter(deal => deal.comments >= 15);
};

/**
 * Filter deals by temperature (> 100)
 * @param  {Array} deals
 * @return {Array} Filtered deals
 */
const filterByHotDeals = (deals) => {
  return deals.filter(deal => deal.temperature >= 100);
};

/**
 * Filter deals by favorites
 * @param  {Array} deals
 * @return {Array} Filtered deals
 */
const filterByFavorites = (deals) => {
  return deals.filter(deal => isFavorite(deal.uuid));
};

/**
 * Sort deals by price
 * @param  {Array} deals
 * @param  {Boolean} ascending - Sort order
 * @return {Array} Sorted deals
 */
const sortByPrice = (deals, ascending = true) => {
  return [...deals].sort((a, b) => {
    return ascending ? a.price - b.price : b.price - a.price;
  });
};

/**
 * Sort deals by date
 * @param  {Array} deals
 * @param  {Boolean} ascending - Sort order
 * @return {Array} Sorted deals
 */
const sortByDate = (deals, ascending = true) => {
  return [...deals].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

/**
 * Apply filter and update UI
 * @param  {Function} filterFn - Filter function
 */
const applyFilter = (filterFn) => {
  filteredDeals = filterFn(currentDeals);
  renderDeals(filteredDeals);
  spanNbDeals.innerHTML = filteredDeals.length;
};

/**
 * Apply sort and update UI
 * @param  {Function} sortFn - Sort function
 * @param  {Boolean} ascending - Sort order
 */
const applySort = (sortFn, ascending) => {
  const dealsToSort = filteredDeals || currentDeals;
  const sortedDeals = sortFn(dealsToSort, ascending);
  renderDeals(sortedDeals);
};

/**
 * Declaration of all Listeners
 */

// Feature 0: Show more deals (6, 12, 24)
selectShow.addEventListener('change', async (event) => {
  const deals = await fetchDeals(currentPagination.currentPage, parseInt(event.target.value));
  setCurrentDeals(deals);
  filteredDeals = null; // Reset filtered deals
  render(currentDeals, currentPagination);
});

// Feature 1: Browse pages
selectPage.addEventListener('change', async (event) => {
  const page = parseInt(event.target.value);
  const size = parseInt(selectShow.value || 6);
  const deals = await fetchDeals(page, size);
  
  setCurrentDeals(deals);
  filteredDeals = null; // Reset filtered deals
  render(currentDeals, currentPagination);
});

// Features 7-10: Vinted sales and indicators
selectLegoSetIds.addEventListener('change', async (event) => {
  const setId = event.target.value;
  if (!setId) return;
  
  const sales = await fetchVintedSales(setId);
  const indicators = calculateSalesIndicators(sales);
  renderSalesInfo(sales, indicators);
});

// Add event listeners for filters and sorts (Features 2-6, 14)
document.addEventListener('DOMContentLoaded', async () => {
  const deals = await fetchDeals();
  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
  
  // Add filter buttons to DOM if they don't exist
  const filtersContainer = document.createElement('div');
  filtersContainer.className = 'filters-container';
  filtersContainer.innerHTML = `
    <div class="filters">
      <button id="filter-discount">Best Discount (>50%)</button>
      <button id="filter-comments">Most Commented (>15)</button>
      <button id="filter-hot">Hot Deals (>100°)</button>
      <button id="filter-favorites">Favorites</button>
      <button id="clear-filters">Clear Filters</button>
    </div>
    <div class="sorts">
      <button id="sort-price-asc">Price: Low to High</button>
      <button id="sort-price-desc">Price: High to Low</button>
      <button id="sort-date-asc">Date: Oldest First</button>
      <button id="sort-date-desc">Date: Newest First</button>
    </div>
  `;
  
  // Insert filters before the deals section
  sectionDeals.parentNode.insertBefore(filtersContainer, sectionDeals);
  
  // Add event listeners for filter buttons
  document.getElementById('filter-discount').addEventListener('click', () => {
    applyFilter(filterByDiscount);
  });
  
  document.getElementById('filter-comments').addEventListener('click', () => {
    applyFilter(filterByComments);
  });
  
  document.getElementById('filter-hot').addEventListener('click', () => {
    applyFilter(filterByHotDeals);
  });
  
  document.getElementById('filter-favorites').addEventListener('click', () => {
    applyFilter(filterByFavorites);
  });
  
  document.getElementById('clear-filters').addEventListener('click', () => {
    filteredDeals = null;
    render(currentDeals, currentPagination);
  });
  
  // Add event listeners for sort buttons
  document.getElementById('sort-price-asc').addEventListener('click', () => {
    applySort(sortByPrice, true);
  });
  
  document.getElementById('sort-price-desc').addEventListener('click', () => {
    applySort(sortByPrice, false);
  });
  
  document.getElementById('sort-date-asc').addEventListener('click', () => {
    applySort(sortByDate, true);
  });
  
  document.getElementById('sort-date-desc').addEventListener('click', () => {
    applySort(sortByDate, false);
  });
  
  // Ensure container for sales info exists
  if (!sectionSalesInfo) {
    const salesInfoSection = document.createElement('div');
    salesInfoSection.id = 'sales-info';
    document.body.appendChild(salesInfoSection);
  }
  
  // Add CSS for better UX (Feature 15)
  const style = document.createElement('style');
  style.textContent = `
    .filters-container {
      margin: 20px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 5px;
    }
    
    .filters, .sorts {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 10px;
    }
    
    button {
      padding: 8px 12px;
      background: #4a69bd;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    button:hover {
      background: #1e3799;
    }
    
    .deal {
      padding: 15px;
      margin-bottom: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
      background: white;
      position: relative;
    }
    
    .deal a {
      color: #3867d6;
      text-decoration: none;
      font-weight: bold;
    }
    
    .deal a:hover {
      text-decoration: underline;
    }
    
    .deal-details {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      font-size: 0.9em;
      color: #666;
    }
    
    .favorite-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
      color: #ccc;
    }
    
    .favorite-btn.is-favorite {
      color: gold;
    }
    
    .sold-link {
      margin-top: 10px;
      display: inline-block;
      padding: 5px 10px;
      background: #f39c12;
      color: white !important;
      border-radius: 3px;
      font-size: 0.8em;
    }
    
    .sales-indicators {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border: 1px solid #eee;
      border-radius: 5px;
    }
    
    .price {
      font-weight: bold;
      color: #27ae60;
    }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .filters, .sorts {
        flex-direction: column;
      }
      
      .deal-details {
        flex-direction: column;
        gap: 5px;
      }
    }
  `;
  
  document.head.appendChild(style);
});
