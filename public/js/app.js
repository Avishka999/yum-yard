/* =========================================================
   Yum Yard — Frontend App
   ========================================================= */

const API = '/api/recipes';

let currentCategory = '';
let currentSearch   = '';

// ─── DOM refs ──────────────────────────────────────────────
const pages = {
  home:   document.getElementById('page-home'),
  detail: document.getElementById('page-detail'),
  form:   document.getElementById('page-form'),
};

const recipesGrid    = document.getElementById('recipes-grid');
const noResults      = document.getElementById('no-results');
const searchInput    = document.getElementById('search-input');
const searchBtn      = document.getElementById('search-btn');
const filterBtns     = document.querySelectorAll('.filter-btn');
const navHome        = document.getElementById('nav-home');
const navAdd         = document.getElementById('nav-add');
const logoLink       = document.getElementById('logo-link');
const backFromDetail = document.getElementById('back-from-detail');
const backFromForm   = document.getElementById('back-from-form');
const formCancelBtn  = document.getElementById('form-cancel-btn');
const recipeForm     = document.getElementById('recipe-form');
const formTitle      = document.getElementById('form-title');
const formError      = document.getElementById('form-error');
const detailContent  = document.getElementById('recipe-detail-content');

// ─── Routing helpers ───────────────────────────────────────
function showPage(name) {
  Object.entries(pages).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  window.scrollTo(0, 0);
}

// ─── Category emojis ───────────────────────────────────────
const CATEGORY_EMOJI = {
  Breakfast: '🍳',
  Lunch:     '🥗',
  Dinner:    '🍝',
  Dessert:   '🍰',
  Snack:     '🥨',
};

function categoryEmoji(cat) {
  return CATEGORY_EMOJI[cat] || '🍽️';
}

// ─── Fetch & render recipes ────────────────────────────────
async function loadRecipes() {
  const params = new URLSearchParams();
  if (currentSearch)   params.set('search', currentSearch);
  if (currentCategory) params.set('category', currentCategory);

  const url = `${API}?${params.toString()}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();
    renderGrid(data);
  } catch (err) {
    recipesGrid.innerHTML = '<p class="no-results">Failed to load recipes. Please try again.</p>';
  }
}

function renderGrid(recipes) {
  if (!recipes.length) {
    recipesGrid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');
  recipesGrid.innerHTML = recipes.map(cardHTML).join('');
  recipesGrid.querySelectorAll('.recipe-card').forEach((card) => {
    const id = card.dataset.id;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-actions')) return;
      openDetail(id);
    });
    card.querySelector('.btn-edit').addEventListener('click', () => openEditForm(id));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteRecipe(id));
  });
}

function cardHTML(r) {
  const img = r.image
    ? `<img class="card-image" src="${escHtml(r.image)}" alt="${escHtml(r.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="card-image-placeholder" style="display:none">${categoryEmoji(r.category)}</div>`
    : `<div class="card-image-placeholder">${categoryEmoji(r.category)}</div>`;

  const meta = [
    r.prepTime  ? `<span>⏱ Prep ${escHtml(r.prepTime)}</span>`  : '',
    r.cookTime  ? `<span>🔥 Cook ${escHtml(r.cookTime)}</span>`  : '',
    r.servings  ? `<span>🍽 ${escHtml(r.servings)} servings</span>` : '',
  ].filter(Boolean).join('');

  return `
  <article class="recipe-card" data-id="${escHtml(r.id)}" role="button" tabindex="0" aria-label="${escHtml(r.title)}">
    ${img}
    <div class="card-body">
      <div class="card-category">${escHtml(r.category)}</div>
      <h2 class="card-title">${escHtml(r.title)}</h2>
      <p class="card-description">${escHtml(r.description)}</p>
      ${meta ? `<div class="card-meta">${meta}</div>` : ''}
    </div>
    <div class="card-actions">
      <button class="btn-edit">✏️ Edit</button>
      <button class="btn-delete">🗑 Delete</button>
    </div>
  </article>`;
}

// ─── Recipe Detail ─────────────────────────────────────────
async function openDetail(id) {
  try {
    const res    = await fetch(`${API}/${id}`);
    if (!res.ok) throw new Error('Not found');
    const recipe = await res.json();
    detailContent.innerHTML = detailHTML(recipe);
    detailContent.querySelector('#detail-edit-btn').addEventListener('click', () => openEditForm(id));
    detailContent.querySelector('#detail-delete-btn').addEventListener('click', () => deleteRecipe(id));
    showPage('detail');
  } catch (err) {
    alert('Could not load recipe details.');
  }
}

function detailHTML(r) {
  const imgBlock = r.image
    ? `<img class="detail-image" src="${escHtml(r.image)}" alt="${escHtml(r.title)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="detail-image-placeholder" style="display:none">${categoryEmoji(r.category)}</div>`
    : `<div class="detail-image-placeholder">${categoryEmoji(r.category)}</div>`;

  const chips = [
    r.prepTime ? `<div class="meta-chip"><div class="label">Prep</div><div class="value">${escHtml(r.prepTime)}</div></div>` : '',
    r.cookTime ? `<div class="meta-chip"><div class="label">Cook</div><div class="value">${escHtml(r.cookTime)}</div></div>` : '',
    r.servings ? `<div class="meta-chip"><div class="label">Servings</div><div class="value">${escHtml(r.servings)}</div></div>` : '',
  ].filter(Boolean).join('');

  const ingredients = r.ingredients.map((i) => `<li>${escHtml(i)}</li>`).join('');
  const steps = r.steps.map((s, idx) => `<li><span class="step-num">${idx + 1}</span><span>${escHtml(s)}</span></li>`).join('');

  return `
    ${imgBlock}
    <div class="detail-category">${escHtml(r.category)}</div>
    <h1 class="detail-title">${escHtml(r.title)}</h1>
    <p class="detail-description">${escHtml(r.description)}</p>
    ${chips ? `<div class="detail-meta">${chips}</div>` : ''}
    <div class="detail-section">
      <h3>🧾 Ingredients</h3>
      <ul class="ingredients-list">${ingredients}</ul>
    </div>
    <div class="detail-section">
      <h3>👨‍🍳 Instructions</h3>
      <ol class="steps-list">${steps}</ol>
    </div>
    <div class="detail-actions">
      <button class="btn-primary" id="detail-edit-btn">✏️ Edit Recipe</button>
      <button class="btn-secondary btn-delete" id="detail-delete-btn">🗑 Delete Recipe</button>
    </div>`;
}

// ─── Add / Edit Form ───────────────────────────────────────
function openAddForm() {
  document.getElementById('recipe-id').value = '';
  recipeForm.reset();
  formTitle.textContent = 'Add New Recipe';
  formError.classList.add('hidden');
  showPage('form');
}

async function openEditForm(id) {
  try {
    const res    = await fetch(`${API}/${id}`);
    if (!res.ok) throw new Error('Not found');
    const recipe = await res.json();

    document.getElementById('recipe-id').value      = recipe.id;
    document.getElementById('f-title').value         = recipe.title;
    document.getElementById('f-description').value   = recipe.description;
    document.getElementById('f-category').value      = recipe.category;
    document.getElementById('f-servings').value      = recipe.servings || '';
    document.getElementById('f-preptime').value      = recipe.prepTime || '';
    document.getElementById('f-cooktime').value      = recipe.cookTime || '';
    document.getElementById('f-image').value         = recipe.image || '';
    document.getElementById('f-ingredients').value   = recipe.ingredients.join('\n');
    document.getElementById('f-steps').value         = recipe.steps.join('\n');

    formTitle.textContent = 'Edit Recipe';
    formError.classList.add('hidden');
    showPage('form');
  } catch (err) {
    alert('Could not load recipe for editing.');
  }
}

recipeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.classList.add('hidden');

  const id          = document.getElementById('recipe-id').value;
  const title       = document.getElementById('f-title').value.trim();
  const description = document.getElementById('f-description').value.trim();
  const category    = document.getElementById('f-category').value;
  const servings    = document.getElementById('f-servings').value.trim();
  const prepTime    = document.getElementById('f-preptime').value.trim();
  const cookTime    = document.getElementById('f-cooktime').value.trim();
  const image       = document.getElementById('f-image').value.trim();
  const ingredients = document.getElementById('f-ingredients').value.trim().split('\n').map((s) => s.trim()).filter(Boolean);
  const steps       = document.getElementById('f-steps').value.trim().split('\n').map((s) => s.trim()).filter(Boolean);

  if (!title || !description || !category || !ingredients.length || !steps.length) {
    formError.textContent = 'Please fill in all required fields.';
    formError.classList.remove('hidden');
    return;
  }

  const payload = { title, description, category, servings, prepTime, cookTime, image, ingredients, steps };
  const method  = id ? 'PUT' : 'POST';
  const url     = id ? `${API}/${id}` : API;

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Save failed');
    }

    goHome();
  } catch (err) {
    formError.textContent = err.message || 'Failed to save recipe.';
    formError.classList.remove('hidden');
  }
});

// ─── Delete ────────────────────────────────────────────────
async function deleteRecipe(id) {
  if (!confirm('Delete this recipe? This cannot be undone.')) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    goHome();
  } catch (err) {
    alert('Failed to delete recipe.');
  }
}

// ─── Navigation ────────────────────────────────────────────
function goHome() {
  showPage('home');
  loadRecipes();
}

logoLink.addEventListener('click', (e) => { e.preventDefault(); goHome(); });
navHome.addEventListener('click',  (e) => { e.preventDefault(); goHome(); });
navAdd.addEventListener('click',   (e) => { e.preventDefault(); openAddForm(); });
backFromDetail.addEventListener('click', goHome);
backFromForm.addEventListener('click',   goHome);
formCancelBtn.addEventListener('click',  goHome);

// ─── Search & Filter ───────────────────────────────────────
searchBtn.addEventListener('click', () => {
  currentSearch = searchInput.value.trim();
  loadRecipes();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    currentSearch = searchInput.value.trim();
    loadRecipes();
  }
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategory = btn.dataset.category;
    loadRecipes();
  });
});

// ─── Keyboard accessibility ────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('recipe-card')) {
    openDetail(e.target.dataset.id);
  }
});

// ─── XSS helper ────────────────────────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Init ──────────────────────────────────────────────────
loadRecipes();
