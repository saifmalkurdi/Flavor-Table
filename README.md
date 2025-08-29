# Flavor Table

A tiny full-stack app that lets you **find recipes by ingredients**, get a **random recipe**, save **favorites** to `localStorage`, and (bonus) view a **recipe details** modal.  
The backend proxies the Spoonacular API so the API key stays private.

---

## Tech Stack

- **Backend:** Node.js, Express, Axios, dotenv
- **Frontend:** Vanilla HTML/CSS/JS (Flexbox only), Google Fonts
- **Data:** Spoonacular API

---

## Project Structure

```
Flavor-Table/
├─ public/
│  ├─ index.html           # Main page (search UI)
│  ├─ favorites.html       # LocalStorage favorites
│  ├─ randomRecipes.html   # Random recipe page
│  ├─ styles.css           # Flexbox styling (sticky nav, bottom footer)
│  └─ app.js               # Frontend logic (search, random, favorites, modal)
├─ routes/
│  ├─ home.js              # Serves index.html from /public
│  └─ recipes.js           # /recipes routes (random, search, details)
├─ .env                    # SPOONACULAR_API_KEY, PORT, etc. (not committed)
├─ .env.example            # Example env file
├─ server.js               # Express app bootstrap & middleware
├─ package.json
└─ README.md
```

---

## Getting Started

### 1) Prerequisites

- Node.js 18+
- A Spoonacular API key (free account is fine for development)

### 2) Install

```bash
npm install
```

### 3) Environment

Create a `.env` file in the project root:

```bash
PORT=3000
SPOONACULAR_API_KEY=YOUR_KEY_HERE
SPOONACULAR_BASE_URL=https://api.spoonacular.com
```

> **Do not** expose your key in frontend code; the server reads it from `.env`.

You can also provide an example file:

```
# .env.example
PORT=3000
SPOONACULAR_API_KEY=CHANGE_ME
SPOONACULAR_BASE_URL=https://api.spoonacular.com
```

### 4) Run

```bash
# dev (if nodemon is set up)
npm run dev

# or plain node
node server.js
```

Open: http://localhost:3000

---

## Server Routes

Base prefix: `/recipes`

### `GET /recipes/random`

Returns one random recipe in a **simplified** form.

**Response**

```json
{
  "id": 716429,
  "title": "Pasta with Garlic",
  "image": "https://...",
  "instructions": "Step 1 ... Step 2 ...",
  "ingredients": ["pasta", "garlic", "olive oil"]
}
```

---

### `GET /recipes/search?ingredients=tomato,cheese&limit=12`

Find recipes that use the given comma-separated ingredients.

**Response**

```json
[
  {
    "id": 632660,
    "title": "Tomato & Cheese Tart",
    "image": "https://...",
    "usedIngredients": ["tomato", "cheese"],
    "missedIngredients": ["basil"]
  }
]
```

- The server **sanitizes** the `ingredients` query (trim/lowercase).
- `limit` is **clamped** to a safe range (e.g., 1–50).

---

### `GET /recipes/:id` _(Bonus)_

Fetches details from Spoonacular `/recipes/{id}/information`.

**Response**

```json
{
  "id": 632660,
  "title": "Tomato & Cheese Tart",
  "image": "https://...",
  "summary": "Text-only summary (HTML stripped)...",
  "readyInMinutes": 35
}
```

---

## Frontend Features

### Search by Ingredients (Home)

- Enter ingredients like `chicken, rice, tomato`
- Cards show:
  - **Image** & **Title**
  - **Used** vs **Missing** ingredients
  - **Save to Favorites** (de-duplicated in `localStorage`)
  - **View Details** (modal → data from `/recipes/:id`)

### Random Recipe Page

- Button triggers `/recipes/random`
- Displays **image, title, step list, ingredients**
- Can **save to favorites** and **view details**

### Favorites Page

- Reads from `localStorage["flavor_table_favorites"]`
- Renders saved recipes
- **Remove** button updates storage & UI

---

## Styling

- **Flexbox-only** layout (no CSS grid)
- **Sticky navbar** over a hero background image
- **Footer pinned** to the bottom via flex column layout
- Warm, restaurant-style palette (pumpkin/orange accent + basil green)
- Google Font: **Inter**

---

## Error Handling

- **Backend**
  - Missing API key → `500` JSON:
    ```json
    { "status": "error", "message": "Server missing SPOONACULAR_API_KEY" }
    ```
  - Upstream/API errors are propagated with appropriate status & message.
- **Frontend**
  - Every fetch checks `res.ok`; errors render a friendly message in the page (`#status`, `#random-status`, etc.).
  - Empty search results show: _“No recipes found. Try different ingredients.”_

---

## Scripts (optional)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Notes

- Spoonacular’s free tier has a daily points quota. During development, keep `limit` small and avoid auto-fetch on page load.
- All calls are **browser → our server → Spoonacular**, so the API key stays private and CORS is simple.

---

## Credits

- Data: **Spoonacular API**
- Hero photo: **Unsplash**

---

## Student Reflection

### How many hours did it take?

I spent **~7 hours** total:

- ~2.5h backend routes, middleware, and `.env` setup
- ~2h frontend search & random pages
- ~1.5h favorites (localStorage + de-dup)
- ~1h styling & polish (Flexbox + sticky nav + footer)
- ~0.5h bonus details modal and README

### Were any parts challenging?

Yes:

- Managing **API quota (HTTP 402)** during testing and confirming the key loaded correctly from `.env`.
- **Normalizing input** and handling **empty results** gracefully.
- Keeping the **API key secret** by routing through Express instead of calling Spoonacular directly in the browser.
- **De-duplicating favorites** across pages/refreshes with a stable composite key (`title||image`).
- Stripping HTML from Spoonacular’s **`summary`** for a clean details view and rendering instructions as readable steps.
