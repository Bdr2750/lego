'use strict';

console.log('🚀 This is it.');

/* --------------------------------------------------
 * MY_FAVORITE_DEALERS constant
 * -------------------------------------------------- */
const MY_FAVORITE_DEALERS = [
  {
    name: 'Dealabs',
    url: 'https://www.dealabs.com/groupe/lego'
  },
  {
    name: 'Avenue de la brique',
    url: 'https://www.avenuedelabrique.com/promotions-et-bons-plans-lego'
  }
];

console.table(MY_FAVORITE_DEALERS);
console.log(MY_FAVORITE_DEALERS[0]);

/**
 * 🌱
 * Let's go with a very very simple first todo
 * Keep pushing
 * 🌱
 */

// 🎯 TODO 1: The highest reduction
// 0. We have 2 favorite LEGO sets shopping communities stored in MY_FAVORITE_DEALERS
// 1. Create a new variable and assign it the link of the lego set with the highest reduction you can find on these 2 websites
// 2. Log the variable
// --------------------------------------------------
// In a real-world scenario, you'd fetch the data from these URLs and determine the set with the best discount.
// For now, we use a placeholder:
const highestReductionLink = 'https://www.dealabs.com/groupe/lego?discountedSetId=12345';
console.log('TODO 1 → highestReductionLink =', highestReductionLink);

/**
 * 🧱
 * We now manipulate the variable `deals`.
 * `deals` is a list of deals from several shopping communities.
 * For demonstration purposes, we define a fake `deals` array.
 * Each item has properties like title, price, discount (as a decimal), date, and community.
 * 🧱
 */
const deals = [
  {
    title: 'LEGO Star Wars – X-Wing',
    price: 49.99,
    discount: 0.33,
    date: '2025-03-20T09:00:00Z',
    community: 'Dealabs'
  },
  {
    title: 'LEGO Technic – Car',
    price: 69.99,
    discount: 0.50,
    date: '2025-03-21T10:00:00Z',
    community: 'Avenue de la brique'
  },
  {
    title: 'LEGO Architecture – Eiffel Tower',
    price: 39.99,
    discount: 0.20,
    date: '2025-03-17T08:00:00Z',
    community: 'Dealabs'
  },
  {
    title: 'LEGO Creator – Surfer Van',
    price: 22.99,
    discount: 0.75,
    date: '2025-03-22T11:00:00Z',
    community: 'Avenue de la brique'
  }
];

/**
 * 🎯 TODO 2: Number of deals
 * 1. Create a variable and assign it the number of deals
 * 2. Log the variable
 */
const numberOfDeals = deals.length;
console.log('TODO 2 → numberOfDeals =', numberOfDeals);

/**
 * 🎯 TODO 3: Website name
 * 1. Create a variable and assign it the list of shopping community names only
 * 2. Log the variable
 * 3. Log how many shopping communities we have (unique names)
 */
const communityNames = deals.map(deal => deal.community);
const uniqueCommunityNames = [...new Set(communityNames)];
console.log('TODO 3 → communityNames:', communityNames);
console.log('TODO 3 → uniqueCommunityNames:', uniqueCommunityNames);
console.log('TODO 3 → number of unique communities:', uniqueCommunityNames.length);

/**
 * 🎯 TODO 4: Sort by price
 * 1. Create a function to sort the deals by price
 * 2. Create a variable and assign it the list of sets by price from lowest to highest
 * 3. Log the variable
 */
function sortByPriceAscending(a, b) {
  return a.price - b.price;
}
const dealsSortedByPrice = [...deals].sort(sortByPriceAscending);
console.log('TODO 4 → dealsSortedByPrice:', dealsSortedByPrice);

/**
 * 🎯 TODO 5: Sort by date
 * 1. Create a function to sort the deals by date
 * 2. Create a variable and assign it the list of deals by date from recent to old
 * 3. Log the variable
 */
function sortByDateDescending(a, b) {
  return new Date(b.date) - new Date(a.date);
}
const dealsSortedByDate = [...deals].sort(sortByDateDescending);
console.log('TODO 5 → dealsSortedByDate:', dealsSortedByDate);

/**
 * 🎯 TODO 6: Filter a specific percentage discount range
 * 1. Filter the list of deals between 50% and 75%
 * 2. Log the list
 */
const filteredDeals50To75 = deals.filter(deal => deal.discount >= 0.5 && deal.discount <= 0.75);
console.log('TODO 6 → filteredDeals50To75:', filteredDeals50To75);

/**
 * 🎯 TODO 7: Average percentage discount
 * 1. Determine the average percentage discount of the deals
 * 2. Log the average
 */
const averageDiscount = deals.reduce((acc, deal) => acc + deal.discount, 0) / deals.length;
console.log('TODO 7 → averageDiscount:', averageDiscount);

/**
 * 🎯 TODO 8: Deals by community
 * 1. Create an object called `communities` to manipulate deals by community name.
 *    The key is the community name and the value is the array of deals for that community.
 * 2. Log the variable.
 * 3. Log the number of deals by community.
 */
const communitiesObject = deals.reduce((acc, deal) => {
  if (!acc[deal.community]) {
    acc[deal.community] = [];
  }
  acc[deal.community].push(deal);
  return acc;
}, {});
console.log('TODO 8 → communitiesObject:', communitiesObject);
Object.keys(communitiesObject).forEach(community => {
  console.log(`→ Community '${community}' has ${communitiesObject[community].length} deals.`);
});

/**
 * 🎯 TODO 9: Sort by price for each community
 * 1. For each community, sort the deals by price from highest to lowest.
 * 2. Log the sorted lists.
 */
Object.keys(communitiesObject).forEach(community => {
  communitiesObject[community].sort((a, b) => b.price - a.price);
  console.log(`TODO 9 → Community '${community}' sorted by descending price:`, communitiesObject[community]);
});

/**
 * 🎯 TODO 10: Sort by date for each community
 * 1. For each community, sort the deals by date from old to recent.
 * 2. Log the sorted lists.
 */
Object.keys(communitiesObject).forEach(community => {
  communitiesObject[community].sort((a, b) => new Date(a.date) - new Date(b.date));
  console.log(`TODO 10 → Community '${community}' sorted from old to recent:`, communitiesObject[community]);
});

/* --------------------------------------------------
 * Now dealing with the VINTED array.
 * -------------------------------------------------- */
const VINTED = [
  {
    link: "https://www.vinted.fr/items/5623924966-lego-walt-disney-tribute-camera-43230",
    price: "48.99",
    title: "Lego Walt Disney Tribute Camera (43230",
    published: "Thu, 09 Jan 2025 07:52:33 GMT",
    uuid: "d90a9062-259e-5499-909c-99a5eb488c86"
  },
  {
    link: "https://www.vinted.fr/items/5567527057-lego-43230-cinepresa-omaggio-a-walt-disney",
    price: "121.45",
    title: "Lego 43230 Cinepresa omaggio a Walt Disney",
    published: "Sat, 28 Dec 2024 09:00:02 GMT",
    uuid: "e96bfdec-45ad-5391-83f7-6e9f3cd7fecb"
  },
  // … other VINTED items …
  {
    link: "https://www.vinted.fr/items/3872250639-lego-43230-disney-new",
    price: "89.95",
    title: "Lego 43230 Disney new",
    published: "Mon, 11 Dec 2023 16:27:33 GMT",
    uuid: "5eb7f1d4-f871-526f-93e0-7b65057f68fd"
  }
];

/**
 * 🎯 TODO 11: Compute the average, the p5 and the p25 price value
 * 1. Compute the average price value of the listing
 * 2. Compute the p5 price value of the listing
 * 3. Compute the p25 price value of the listing
 */
// Convert string prices to numbers.
const vintedPrices = VINTED.map(item => parseFloat(item.price));

// 1. Average price:
const vintedAveragePrice = vintedPrices.reduce((acc, p) => acc + p, 0) / vintedPrices.length;
console.log('TODO 11 → Average price =', vintedAveragePrice);

// Helper function to compute a percentile from a sorted array.
function percentile(arr, p) {
  if (arr.length === 0) return 0;
  if (p <= 0) return arr[0];
  if (p >= 1) return arr[arr.length - 1];
  const index = (arr.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return arr[lower];
  // interpolate if needed
  return arr[lower] + (arr[upper] - arr[lower]) * (index - lower);
}

// Sort prices in ascending order.
const sortedVintedPrices = [...vintedPrices].sort((a, b) => a - b);

// 2. p5 (5th percentile)
const vintedP5 = percentile(sortedVintedPrices, 0.05);
console.log('TODO 11 → p5 price =', vintedP5);

// 3. p25 (25th percentile)
const vintedP25 = percentile(sortedVintedPrices, 0.25);
console.log('TODO 11 → p25 price =', vintedP25);

/**
 * 🎯 TODO 12: Very old listed items
 * 1. Log if we have very old items (true or false)
 *    A very old item is one published more than 3 weeks (21 days) ago.
 */
const now = new Date();
const THREE_WEEKS_IN_MS = 21 * 24 * 60 * 60 * 1000;
const hasVeryOldItem = VINTED.some(item => {
  const itemDate = new Date(item.published);
  return now - itemDate > THREE_WEEKS_IN_MS;
});
console.log('TODO 12 → hasVeryOldItem =', hasVeryOldItem);

/**
 * 🎯 TODO 13: Find a specific item
 * 1. Find the item with the uuid `f2c5377c-84f9-571d-8712-98902dcbb913`
 * 2. Log the item
 */
const specificUuid = 'f2c5377c-84f9-571d-8712-98902dcbb913';
const foundItem = VINTED.find(item => item.uuid === specificUuid);
console.log('TODO 13 → Found item for uuid', specificUuid, ':', foundItem);

/**
 * 🎯 TODO 14: Delete a specific item
 * 1. Delete the item with the uuid `f2c5377c-84f9-571d-8712-98902dcbb913`
 * 2. Log the new list of items
 */
const vintedWithoutSpecificUuid = VINTED.filter(item => item.uuid !== specificUuid);
console.log('TODO 14 → vintedWithoutSpecificUuid:', vintedWithoutSpecificUuid);

/**
 * 🎯 TODO 15: Save a favorite item
 * We declare and assign a variable called `sealedCamera`
 */
let sealedCamera = {
  link: "https://www.vinted.fr/items/5563396347-lego-43230-omaggio-a-walter-disney-misb",
  price: "131.95",
  title: "LEGO 43230 omaggio a Walter Disney misb",
  published: "Thu, 26 Dec 2024 21:18:04 GMT",
  uuid: "18751705-536e-5c1f-9a9d-383a3a629df5"
};
// Make a copy of `sealedCamera` to `camera` variable.
let camera = sealedCamera;

// 1. Set a new property `favorite` to true, then log both variables.
camera.favorite = true;
console.log('TODO 15 → sealedCamera:', sealedCamera);
console.log('TODO 15 → camera:', camera);
// Notice: Both `sealedCamera` and `camera` now have the property `favorite` because they reference the same object.

// 2. Reassign sealedCamera to a new object (resetting it).
sealedCamera = {
  link: "https://www.vinted.fr/items/5563396347-lego-43230-omaggio-a-walter-disney-misb",
  price: "131.95",
  title: "LEGO 43230 omaggio a Walter Disney misb",
  published: "Thu, 26 Dec 2024 21:18:04 GMT",
  uuid: "18751705-536e-5c1f-9a9d-383a3a629df5"
};

// 3. Update `camera` so it has favorite = true without modifying sealedCamera.
camera = { ...sealedCamera, favorite: true };
console.log('After reassigning sealedCamera:');
console.log('→ sealedCamera:', sealedCamera);
console.log('→ camera:', camera);

/**
 * 🎯 TODO 16: Compute the profitability
 * From a specific deal called `deal`
 */
const deal = {
  title: 'La caméra Hommage à Walt Disney',
  retail: 75.98,
  price: 56.98,
  legoId: '43230'
};
// 1. Compute the potential highest profitability based on the VINTED items.
//    For example, if you resold the item at the highest price found on VINTED, what would be the profit?
const maxVintedPrice = Math.max(...vintedPrices);
const potentialProfit = maxVintedPrice - deal.price;
console.log('TODO 16 → potential highest profit =', potentialProfit);

/**
 * 🎯 LAST TODO: Save in localStorage
 * 1. Save MY_FAVORITE_DEALERS in the localStorage.
 * 2. Log the localStorage.
 *
 * Note: This will only work in a browser environment.
 */
localStorage.setItem('MY_FAVORITE_DEALERS', JSON.stringify(MY_FAVORITE_DEALERS));
console.log('LAST TODO → localStorage:', localStorage.getItem('MY_FAVORITE_DEALERS'));

