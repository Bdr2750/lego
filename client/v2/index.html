'use strict';

let currentDeals = [];
let currentPagination = {};
let filters = {
  bestDiscount: false,
  mostCommented: false,
  hotDeals: false,
  favorites: false
};

// Selectors for existing elements in the new design
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sortSelect = document.querySelector('#sort-select'); // Now part of the HTML
const dealsContainer = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');
const dealsCount = document.querySelector('#deals-count');

const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
  
  // Update the total deals count display
  spanNbDeals.textContent = result.length;
  if (dealsCount) {
    dealsCount.textContent = `(${result.length} total)`;
  }
  
  // Update page selector based on pagination
  if (meta.totalPages) {
    updatePageSelector(meta.totalPages, meta.currentPage);
  }
};

const updatePageSelector = (totalPages, currentPage) => {
  selectPage.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Page ${i}`;
    if (i === currentPage) {
      option.selected = true;
    }
    selectPage.appendChild(option);
  }
};

const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();
    return body.success ? body.data : { result: [], meta: {} };
  } catch (error) {
    console.error(error);
    return { result: [], meta: {} };
  }
};

const applyFiltersAndSorting = (deals) => {
  let filtered = [...deals];
  if (filters.bestDiscount) filtered = filtered.filter(d => d.discount > 50);
  if (filters.mostCommented) filtered = filtered.filter(d => d.comments > 15);
  if (filters.hotDeals) filtered = filtered.filter(d => d.temperature > 100);
  if (filters.favorites) {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    filtered = filtered.filter(d => favs.includes(d.uuid));
  }

  switch(sortSelect.value) {
    case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
    case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
    case 'date-asc': filtered.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
    case 'date-desc': filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
  }
  
  return filtered;
};

const renderDeals = (deals) => {
  const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
  
  if (deals.length === 0) {
    dealsContainer.innerHTML = '<div class="no-deals">No deals found matching your criteria</div>';
    return;
  }
  
  const template = deals.map(deal => `
    <div class="deal-item">
      <div class="deal-thumbnail">🧱</div>
      <div class="deal-content">
        <span class="deal-id">ID: ${deal.id}</span>
        <a href="${deal.link}" class="deal-title" target="_blank">${deal.title}</a>
        <div class="deal-price">$${deal.price}</div>
        <div class="deal-meta">
          ${deal.discount ? `<span class="deal-discount">-${deal.discount}%</span>` : ''}
          ${deal.temperature ? `<span class="deal-temp">${deal.temperature}°</span>` : ''}
          ${deal.comments ? `<span class="deal-comments">${deal.comments} comments</span>` : ''}
        </div>
        <div class="deal-actions">
          <button class="favorite-btn" data-uuid="${deal.uuid}" 
                  style="color: ${favs.includes(deal.uuid) ? 'red' : 'grey'}">❤️</button>
          <span class="deal-date">${formatDate(deal.date)}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  dealsContainer.innerHTML = template;
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Update Lego set ID selector with unique IDs
const updateLegoSetIdSelector = (deals) => {
  const legoSetIdSelect = document.querySelector('#lego-set-id-select');
  if (!legoSetIdSelect) return;
  
  // Get unique set IDs using the utility function
  const ids = getIdsFromDeals(deals);
  const uniqueIds = [...new Set(ids)].filter(id => id); // Remove empty IDs
  
  legoSetIdSelect.innerHTML = '<option value="">All Sets</option>';
  uniqueIds.forEach(id => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = id;
    legoSetIdSelect.appendChild(option);
  });
};

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Initial load
  const data = await fetchDeals();
  setCurrentDeals(data);
  
  const filteredDeals = applyFiltersAndSorting(data.result);
  renderDeals(filteredDeals);
  updateLegoSetIdSelector(data.result);
});

selectShow.addEventListener('change', async (e) => {
  const data = await fetchDeals(currentPagination.currentPage || 1, parseInt(e.target.value));
  setCurrentDeals(data);
  renderDeals(applyFiltersAndSorting(data.result));
});

selectPage.addEventListener('change', async (e) => {
  const data = await fetchDeals(parseInt(e.target.value), parseInt(selectShow.value));
  setCurrentDeals(data);
  renderDeals(applyFiltersAndSorting(data.result));
});

// Handle lego set id filtering
document.querySelector('#lego-set-id-select')?.addEventListener('change', (e) => {
  const selectedId = e.target.value;
  
  if (selectedId) {
    renderDeals(applyFiltersAndSorting(currentDeals.filter(deal => deal.id === selectedId)));
  } else {
    renderDeals(applyFiltersAndSorting(currentDeals));
  }
});

document.addEventListener('click', (e) => {
  // Handle favorite toggles
  if (e.target.classList.contains('favorite-btn')) {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const uuid = e.target.dataset.uuid;
    const newFavs = favs.includes(uuid) ? favs.filter(id => id !== uuid) : [...favs, uuid];
    localStorage.setItem('favorites', JSON.stringify(newFavs));
    e.target.style.color = newFavs.includes(uuid) ? 'red' : 'grey';
  }
});

// Filter checkbox event listeners
document.querySelectorAll('.filter').forEach(checkbox => {
  checkbox.addEventListener('change', (e) => {
    filters[e.target.dataset.filter] = e.target.checked;
    renderDeals(applyFiltersAndSorting(currentDeals));
  });
});

sortSelect.addEventListener('change', () => {
  renderDeals(applyFiltersAndSorting(currentDeals));
});
