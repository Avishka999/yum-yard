const request = require('supertest');
const path    = require('path');
const fs      = require('fs');

// Use a temporary copy of recipes.json so tests don't corrupt real data
const ORIGINAL_DATA = path.join(__dirname, '..', 'data', 'recipes.json');
const TEST_DATA     = path.join(__dirname, '..', 'data', 'recipes.test.json');

// Patch the DATA_FILE used by server before requiring it
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: (...args) => {
      const result = originalPath.join(...args);
      // Redirect recipes.json reads/writes to a test copy
      if (result.endsWith('data/recipes.json')) {
        return result.replace('recipes.json', 'recipes.test.json');
      }
      return result;
    },
  };
});

let app, server;

beforeAll(() => {
  // Create a fresh test data file
  const seed = [
    {
      id: 'test-1',
      title: 'Test Pancakes',
      description: 'Fluffy test pancakes',
      category: 'Breakfast',
      prepTime: '10 min',
      cookTime: '15 min',
      servings: '2',
      ingredients: ['1 cup flour', '1 egg', '1 cup milk'],
      steps: ['Mix ingredients', 'Pour batter', 'Flip when bubbly'],
      image: '',
      createdAt: new Date().toISOString(),
    },
  ];
  fs.writeFileSync(TEST_DATA, JSON.stringify(seed, null, 2), 'utf8');

  const mod = require('../server');
  app    = mod.app;
  server = mod.server;
});

afterAll((done) => {
  // Clean up test file and close server
  if (fs.existsSync(TEST_DATA)) fs.unlinkSync(TEST_DATA);
  server.close(done);
});

// ─── GET /api/recipes ──────────────────────────────────────
describe('GET /api/recipes', () => {
  it('returns an array of recipes', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('filters by search query', async () => {
    const res = await request(app).get('/api/recipes?search=pancakes');
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.title.toLowerCase().includes('pancakes') || r.description.toLowerCase().includes('pancakes'))).toBe(true);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/recipes?category=Breakfast');
    expect(res.status).toBe(200);
    expect(res.body.every((r) => r.category === 'Breakfast')).toBe(true);
  });

  it('returns empty array for unmatched search', async () => {
    const res = await request(app).get('/api/recipes?search=zzznomatch');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── GET /api/recipes/:id ──────────────────────────────────
describe('GET /api/recipes/:id', () => {
  it('returns a single recipe', async () => {
    const res = await request(app).get('/api/recipes/test-1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('test-1');
    expect(res.body.title).toBe('Test Pancakes');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/recipes/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ─── POST /api/recipes ─────────────────────────────────────
describe('POST /api/recipes', () => {
  let createdId;

  it('creates a new recipe', async () => {
    const payload = {
      title: 'New Test Recipe',
      description: 'A recipe created in tests',
      category: 'Lunch',
      prepTime: '5 min',
      cookTime: '20 min',
      servings: '1',
      ingredients: ['Ingredient A', 'Ingredient B'],
      steps: ['Step 1', 'Step 2'],
    };

    const res = await request(app).post('/api/recipes').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('New Test Recipe');
    createdId = res.body.id;
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/recipes').send({ title: 'Incomplete' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  // cleanup
  afterAll(async () => {
    if (createdId) {
      await request(app).delete(`/api/recipes/${createdId}`);
    }
  });
});

// ─── PUT /api/recipes/:id ──────────────────────────────────
describe('PUT /api/recipes/:id', () => {
  it('updates an existing recipe', async () => {
    const payload = {
      title: 'Updated Pancakes',
      description: 'Updated description',
      category: 'Breakfast',
      ingredients: ['1 cup flour', '2 eggs'],
      steps: ['Mix', 'Cook'],
    };

    const res = await request(app).put('/api/recipes/test-1').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Pancakes');
  });

  it('returns 404 for unknown id', async () => {
    const payload = {
      title: 'X', description: 'X', category: 'Snack',
      ingredients: ['X'], steps: ['X'],
    };
    const res = await request(app).put('/api/recipes/ghost-id').send(payload);
    expect(res.status).toBe(404);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).put('/api/recipes/test-1').send({ title: 'Only title' });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/recipes/:id ───────────────────────────────
describe('DELETE /api/recipes/:id', () => {
  it('deletes a recipe and returns 204', async () => {
    // Create a temporary recipe to delete
    const createRes = await request(app).post('/api/recipes').send({
      title: 'To Delete',
      description: 'Delete me',
      category: 'Snack',
      ingredients: ['x'],
      steps: ['x'],
    });
    const id = createRes.body.id;

    const deleteRes = await request(app).delete(`/api/recipes/${id}`);
    expect(deleteRes.status).toBe(204);

    // Confirm it's gone
    const getRes = await request(app).get(`/api/recipes/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/recipes/no-such-id');
    expect(res.status).toBe(404);
  });
});
