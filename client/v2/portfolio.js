'use strict';

let currentDeals = [];
let currentPagination = {};
let filters = {
  bestDiscount: false,
  mostCommented: false,
  hotDeals: false,
  favorites: false
};

// Original selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionDeals = document.querySelector('#deals');
const spanNbDeals = document.querySelector('#nbDeals');

// New feature selectors (dynamically created)
const sortSelect = document.createElement('select');
sortSelect.innerHTML = `
  <option value="">Sort By</option>
  <option value="price-asc">Price Low to High</option>
  <option value="price-desc">Price High to Low</option>
  <option value="date-asc">Date Oldest</option>
  <option value="date-desc">Date Newest</option>
`;

// Create filter controls
const filterContainer = document.createElement('div');
filterContainer.innerHTML = `
  <label><input type="checkbox" class="filter" data-filter="bestDiscount"> >50% Discount</label>
  <label><input type="checkbox" class="filter" data-filter="mostCommented"> >15 Comments</label>
  <label><input type="checkbox" class="filter" data-filter="hotDeals"> >100° Temperature</label>
  <label><input type="checkbox" class="filter" data-filter="favorites"> Favorites</label>
`;

// Insert controls before deals section
sectionDeals.parentNode.insertBefore(sortSelect, sectionDeals);
sectionDeals.parentNode.insertBefore(filterContainer, sectionDeals);

const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
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
  const template = deals.map(deal => `
    <div class="deal">
      <span>${deal.id}</span>
      <a href="${deal.link}" target="_blank">${deal.title}</a>
      <span>${deal.price}</span>
      <button class="favorite-btn" data-uuid="${deal.uuid}" 
              style="color: ${favs.includes(deal.uuid) ? 'red' : 'grey'}">❤️</button>
    </div>
  `).join('');
  sectionDeals.innerHTML = `<h2>Deals</h2>${template}`;
};

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize show options
  selectShow.innerHTML = [6, 12, 24].map(s => `<option value="${s}">${s}</option>`).join('');

  // Initial load
  const data = await fetchDeals();
  setCurrentDeals(data);
  renderDeals(applyFiltersAndSorting(data.result));
});

selectShow.addEventListener('change', async (e) => {
  const data = await fetchDeals(currentPagination.currentPage, parseInt(e.target.value));
  setCurrentDeals(data);
  renderDeals(applyFiltersAndSorting(data.result));
});

selectPage.addEventListener('change', async (e) => {
  const data = await fetchDeals(parseInt(e.target.value), currentPagination.pageSize);
  setCurrentDeals(data);
  renderDeals(applyFiltersAndSorting(data.result));
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

  // Handle filter toggles
  if (e.target.classList.contains('filter')) {
    filters[e.target.dataset.filter] = e.target.checked;
    renderDeals(applyFiltersAndSorting(currentDeals));
  }
});

sortSelect.addEventListener('change', () => {
  renderDeals(applyFiltersAndSorting(currentDeals));
});