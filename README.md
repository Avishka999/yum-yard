# 🍽️ Yum Yard

A recipe collection and sharing web application where you can browse, add, edit, and search for delicious recipes.

## Features

- 📋 Browse recipes with card-based UI
- 🔍 Full-text search across title, description, and ingredients
- 🏷️ Filter by category (Breakfast, Lunch, Dinner, Dessert, Snack)
- ➕ Add new recipes with a guided form
- ✏️ Edit or 🗑️ delete existing recipes
- 📱 Responsive design

## Tech Stack

- **Backend:** Node.js + Express (REST API)
- **Frontend:** Vanilla HTML/CSS/JavaScript (single-page app)
- **Data:** JSON flat-file store

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Installation

```bash
npm install
```

### Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run tests

```bash
npm test
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/recipes` | List all recipes (supports `?search=` and `?category=`) |
| GET    | `/api/recipes/:id` | Get a single recipe |
| POST   | `/api/recipes` | Create a new recipe |
| PUT    | `/api/recipes/:id` | Update a recipe |
| DELETE | `/api/recipes/:id` | Delete a recipe |

### Recipe object

```json
{
  "id": "uuid",
  "title": "Classic Spaghetti Bolognese",
  "description": "A rich and hearty Italian meat sauce...",
  "category": "Dinner",
  "prepTime": "15 min",
  "cookTime": "45 min",
  "servings": "4",
  "ingredients": ["400g spaghetti", "500g ground beef", "..."],
  "steps": ["Heat oil...", "Sauté onion...", "..."],
  "image": "https://...",
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

