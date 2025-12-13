// === Этап 1: Массив из 15 объектов ===
const services = [
  { id: 1, name: "Web Design", category: "design", price: 299, rating: 4.7, description: "Modern responsive website design for startups.", image: "../assets/solution1.png" },
  { id: 2, name: "UI/UX Audit", category: "design", price: 199, rating: 4.5, description: "Comprehensive usability and interface review.", image: "../assets/solution2.png" },
  { id: 3, name: "Frontend Development", category: "development", price: 899, rating: 4.9, description: "React, Vue, or Angular implementation.", image: "../assets/solution3.png" },
  { id: 4, name: "Backend API", category: "development", price: 1200, rating: 4.8, description: "Secure and scalable RESTful or GraphQL API.", image: "../assets/solution1.png" },
  { id: 5, name: "SEO Optimization", category: "marketing", price: 349, rating: 4.3, description: "Improve your search engine visibility.", image: "../assets/solution2.png" },
  { id: 6, name: "Social Media Campaign", category: "marketing", price: 599, rating: 4.6, description: "Targeted ad campaigns on major platforms.", image: "../assets/solution3.png" },
  { id: 7, name: "Business Strategy", category: "consulting", price: 750, rating: 4.8, description: "Growth roadmap for early-stage startups.", image: "../assets/solution1.png" },
  { id: 8, name: "Tech Consulting", category: "consulting", price: 650, rating: 4.7, description: "Architecture and stack selection advice.", image: "../assets/solution2.png" },
  { id: 9, name: "Data Analytics", category: "analytics", price: 950, rating: 4.9, description: "Custom dashboards and KPI tracking.", image: "../assets/solution3.png" },
  { id: 10, name: "User Behavior Analysis", category: "analytics", price: 499, rating: 4.4, description: "Heatmaps and session recording.", image: "../assets/solution1.png" },
  { id: 11, name: "24/7 Support", category: "support", price: 149, rating: 4.2, description: "Live chat and ticketing system.", image: "../assets/solution2.png" },
  { id: 12, name: "Incident Response", category: "support", price: 299, rating: 4.5, description: "Rapid issue resolution for critical bugs.", image: "../assets/solution3.png" },
  { id: 13, name: "Penetration Testing", category: "security", price: 1500, rating: 5.0, description: "Ethical hacking to find vulnerabilities.", image: "../assets/solution1.png" },
  { id: 14, name: "Cloud Migration", category: "cloud", price: 1100, rating: 4.8, description: "Move your infrastructure to AWS/Azure/GCP.", image: "../assets/solution2.png" },
  { id: 15, name: "AI Chatbot", category: "ai", price: 899, rating: 4.6, description: "Custom NLP-powered chatbot for your business.", image: "../assets/solution3.png" }
];

const methodsMap = {
  map: mapExample,
  filter: filterExample,
  sortPrice: sortExample,
  reduce: reduceExample,
  find: findExample,
  every: everyExample,
  some: someExample,
  slice: sliceExample,
  flatMap: flatMapExample,
  reverse: reverseExample
};

let currentData = [...services];
let activeMethod = null;
let activeFilter = 'all';

const catalogGrid = document.getElementById('catalogGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterButtonsContainer = document.getElementById('filterButtons');
const methodButtonsContainer = document.getElementById('methodButtons');

// === Этап 3: Вспомогательные функции ===

function renderServices(servicesArray) {
  if (servicesArray.length === 0) {
    catalogGrid.innerHTML = '<div class="no-results">No services match your criteria.</div>';
    return;
  }

  catalogGrid.innerHTML = servicesArray.map(service => `
    <div class="service-card">
      <div class="service-image" style="background: #f0f0f0 url('${service.image}') center/cover no-repeat;"></div>
      <div class="service-category">${service.category}</div>
      <h3 class="service-title">${service.name}</h3>
      <p class="service-description">${service.description}</p>
      <div class="service-price">$${service.price}</div>
      <div class="service-rating">${"★".repeat(Math.floor(service.rating))}${service.rating % 1 >= 0.5 ? "½" : ""}</div>
    </div>
  `).join('');
}

function applyFiltersAndSort() {
  let result = [...services];

  if (activeMethod) {
    try {
      if (activeMethod && methodsMap[activeMethod]) {
        result = methodsMap[activeMethod](result);
        }
    } catch (e) {
      console.error("Method error:", e);
    }
  }

  if (activeFilter !== 'all') {
    result = result.filter(s => s.category === activeFilter);
  }

  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    result = result.filter(s =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.description.toLowerCase().includes(searchTerm)
    );
  }

  const sortValue = sortSelect.value;
  if (sortValue !== 'default') {
    result.sort((a, b) => {
      switch (sortValue) {
        case 'nameAsc': return a.name.localeCompare(b.name);
        case 'nameDesc': return b.name.localeCompare(a.name);
        case 'priceAsc': return a.price - b.price;
        case 'priceDesc': return b.price - a.price;
        case 'ratingDesc': return b.rating - a.rating;
        default: return 0;
      }
    });
  }

  currentData = result;
  renderServices(result);
}

// === Этап 2: 10 методов массивов ===

function mapExample(arr) {
  return arr.map(s => ({ ...s, name: `[Mapped] ${s.name}` }));
}

function filterExample(arr) {
  return arr.filter(s => s.price > 500);
}

function sortExample(arr) {
  return [...arr].sort((a, b) => a.price - b.price);
}

function reduceExample(arr) {
  const avgPrice = arr.reduce((sum, s) => sum + s.price, 0) / arr.length;
  return arr.filter(s => s.price > avgPrice);
}

function findExample(arr) {
  const found = arr.find(s => s.rating >= 4.9);
  return found ? [found] : [];
}

function everyExample(arr) {
  const allHighRated = arr.every(s => s.rating >= 4.5);
  return allHighRated ? arr : [];
}

function someExample(arr) {
  const hasCheap = arr.some(s => s.price < 200);
  return hasCheap ? arr.filter(s => s.price < 200) : [];
}

function sliceExample(arr) {
  return arr.slice(0, 5); 
}

function flatMapExample(arr) {
  return arr.flatMap(s => [s, { ...s, name: `${s.name} (Pro)` }]);
}

function reverseExample(arr) {
  return [...arr].reverse();
}

const methods = [
  { name: 'map', fn: mapExample, label: 'Map: Add prefix' },
  { name: 'filter', fn: filterExample, label: 'Filter: Price > $500' },
  { name: 'sortPrice', fn: sortExample, label: 'Sort: By price ↑' },
  { name: 'reduce', fn: reduceExample, label: 'Reduce: Above avg price' },
  { name: 'find', fn: findExample, label: 'Find: Rating ≥ 4.9' },
  { name: 'every', fn: everyExample, label: 'Every: All ≥ 4.5?' },
  { name: 'some', fn: someExample, label: 'Some: Cheap (<$200)?' },
  { name: 'slice', fn: sliceExample, label: 'Slice: First 5' },
  { name: 'flatMap', fn: flatMapExample, label: 'FlatMap: Duplicate' },
  { name: 'reverse', fn: reverseExample, label: 'Reverse order' }
];

document.addEventListener('DOMContentLoaded', () => {
  methodButtonsContainer.innerHTML = methods.map(m => 
    `<button class="method-btn" data-method="${m.name}">${m.label}</button>`
  ).join('');

  const categories = [...new Set(services.map(s => s.category))];
  filterButtonsContainer.innerHTML = `
    <button class="filter-btn active" data-filter="all">All</button>
    ${categories.map(cat => 
      `<button class="filter-btn" data-filter="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`
    ).join('')}
  `;

  methodButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('method-btn')) {
      document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeMethod = e.target.dataset.method;
      applyFiltersAndSort();
    }
  });

  filterButtonsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      activeFilter = e.target.dataset.filter;
      applyFiltersAndSort();
    }
  });

  searchInput.addEventListener('input', applyFiltersAndSort);
  sortSelect.addEventListener('change', applyFiltersAndSort);

  applyFiltersAndSort();
});