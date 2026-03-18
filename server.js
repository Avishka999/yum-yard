const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'recipes.json');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(apiLimiter);
app.use(express.static(path.join(__dirname, 'public')));

function readRecipes() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

function writeRecipes(recipes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2), 'utf8');
}

// GET all recipes (supports ?search= and ?category= query params)
app.get('/api/recipes', (req, res) => {
  let recipes = readRecipes();
  const { search, category } = req.query;

  if (search) {
    const term = search.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.ingredients.some((i) => i.toLowerCase().includes(term))
    );
  }

  if (category) {
    recipes = recipes.filter(
      (r) => r.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json(recipes);
});

// GET a single recipe by id
app.get('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

// POST create a new recipe
app.post('/api/recipes', (req, res) => {
  const { title, description, category, prepTime, cookTime, servings, ingredients, steps, image } = req.body;

  if (!title || !description || !category || !ingredients || !steps) {
    return res.status(400).json({ error: 'Missing required fields: title, description, category, ingredients, steps' });
  }

  const recipes = readRecipes();
  const newRecipe = {
    id: uuidv4(),
    title,
    description,
    category,
    prepTime: prepTime || '',
    cookTime: cookTime || '',
    servings: servings || '',
    ingredients,
    steps,
    image: image || '',
    createdAt: new Date().toISOString(),
  };

  recipes.push(newRecipe);
  writeRecipes(recipes);
  res.status(201).json(newRecipe);
});

// PUT update a recipe
app.put('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const { title, description, category, prepTime, cookTime, servings, ingredients, steps, image } = req.body;

  if (!title || !description || !category || !ingredients || !steps) {
    return res.status(400).json({ error: 'Missing required fields: title, description, category, ingredients, steps' });
  }

  recipes[index] = {
    ...recipes[index],
    title,
    description,
    category,
    prepTime: prepTime || '',
    cookTime: cookTime || '',
    servings: servings || '',
    ingredients,
    steps,
    image: image || recipes[index].image,
    updatedAt: new Date().toISOString(),
  };

  writeRecipes(recipes);
  res.json(recipes[index]);
});

// DELETE a recipe
app.delete('/api/recipes/:id', (req, res) => {
  const recipes = readRecipes();
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  recipes.splice(index, 1);
  writeRecipes(recipes);
  res.status(204).send();
});

// Serve the frontend for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`Yum Yard server running on http://localhost:${PORT}`);
});

module.exports = { app, server };
