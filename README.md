# Flavor Table

A tiny full-stack app that lets you **find recipes by ingredients**, get a **random recipe**, save **favorites** to a **Postgres database**, and (bonus) view a **recipe details** modal.  
The backend proxies the Spoonacular API so the API key stays private.

---

## Tech Stack

- **Backend:** Node.js, Express, Axios, dotenv, pg
- **Frontend:** Vanilla HTML/CSS/JS (Flexbox only), Google Fonts
- **Database:** PostgreSQL (stores favorites as rows)
- **Data Source:** Spoonacular API

---

## Project Structure

```
Flavor-Table/
├─ public/
│  ├─ index.html                 # Main page (search UI)
│  ├─ favorites.html             # Favorites page (reads from DB)
│  ├─ randomRecipes.html         # Random recipe page
│  ├─ styles.css                 # Flexbox styling (sticky nav, bottom footer)
│  ├─ app.js                     # Main entry (imports modular files)
│  ├─ database_CRUD/
│  │  └─ api.js                  # Frontend API calls to backend CRUD
│  ├─ modal_UI/
│  │  └─ modal.js                # Modal logic (details + edit form)
│  └─ recipes/                   # Feature modules
│     ├─ showRecipeDetail.js     # Fetch details + open modal
│     └─ showRandomRecipe.js     # Random page boot/render
├─ routes/
│  ├─ home.js                    # Serves index.html
│  └─ api/
│     └─ recipes.js              # /api/recipes CRUD routes (DB)
├─ routes/Recipes/               # Proxy to Spoonacular for UI data
│  ├─ index.js                   # mounts /random, /search, /:id
│  ├─ random.js                  # GET /recipes/random
│  ├─ search.js                  # GET /recipes/search
│  └─ details.js                 # GET /recipes/:id
├─ server.js                     # Express app bootstrap & middleware
├─ .env                          # DB creds, Spoonacular key, PORT, etc.
├─ .env.example                  # Example env file
├─ package.json
└─ README.md
```

---

## Getting Started

### 1) Prerequisites

- Node.js **18+**
- PostgreSQL **14+**
- A Spoonacular API key (free plan is fine for development)

### 2) Install

```bash
npm install
```

### 3) Environment

Create a `.env` file in the project root:

```bash
PORT=3000

# Spoonacular
SPOONACULAR_API_KEY=YOUR_KEY_HERE
SPOONACULAR_BASE_URL=https://api.spoonacular.com

# Database
DATABASE_URL=postgres://user:password@localhost:5432/flavor_table
```

Provide an example file too:

```dotenv
# .env.example
PORT=3000
SPOONACULAR_API_KEY=CHANGE_ME
SPOONACULAR_BASE_URL=https://api.spoonacular.com
DATABASE_URL=postgres://user:password@localhost:5432/flavor_table
```

> ⚠️ Never commit your real `.env`.

### 4) Run

```bash
# dev (if nodemon is set up)
npm run dev

# or plain node
node server.js
```

Open: <http://localhost:3000>

---

## Server Routes

### Proxy (public UI) endpoints — prefix: `/recipes`

- `GET /recipes/random` → one random recipe (simplified)
- `GET /recipes/search?ingredients=tomato,cheese&limit=12` → array of matches
- `GET /recipes/:id` → details (summary text, image, readyInMinutes)

**Examples**

`GET /recipes/random`

```json
{
  "id": 716429,
  "title": "Pasta with Garlic",
  "image": "https://...",
  "instructions": "Step 1 ... Step 2 ...",
  "ingredients": ["pasta", "garlic", "olive oil"]
}
```

`GET /recipes/search?ingredients=tomato,cheese&limit=12`

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

`GET /recipes/:id`

```json
{
  "id": 632660,
  "title": "Tomato & Cheese Tart",
  "image": "https://...",
  "summary": "Text-only summary (HTML stripped)…",
  "readyInMinutes": 35
}
```

> The server sanitizes queries (trim/lowercase) and clamps `limit` to a safe range.

---

### DB CRUD endpoints — prefix: `/api/recipes`

- `GET /api/recipes` → all favorites
- `POST /api/recipes` → create a favorite  
  Body (example):

  ```json
  {
    "title": "Caprese Pasta",
    "image": "https://...",
    "instructions": "",
    "ingredients": ["pasta", "tomato", "mozzarella", "basil"],
    "readyIn": 20
  }
  ```

  - On duplicate title (case-insensitive), returns **409 Conflict**:
    ```json
    { "status": "fail", "message": "This recipe is already in your favorites." }
    ```

- `PUT /api/recipes/:id` → update a favorite (same shape as POST)

  - On duplicate title, returns **409 Conflict**.

- `DELETE /api/recipes/:id` → remove a favorite

> API always returns `readyIn` (camelCase) in JSON, even though the DB column is `readyin` (snake).

---

## Frontend Features

### Search by Ingredients (Home)

- Enter ingredients like `chicken, rice, tomato`
- Each card shows:
  - **Image** & **Title**
  - **Used** vs **Missing** ingredients
  - **Save to Favorites** → DB (handles duplicates gracefully)
  - **View Details** → opens modal populated via `/recipes/:id`

### Random Recipe Page

- Button triggers `/recipes/random`
- Displays:
  - Title, image
  - Steps (split into readable list)
  - Ingredients list
- **Save** and **View Details** buttons included

### Favorites Page

- Reads from DB (`/api/recipes`)
- Renders saved recipes with:
  - **Edit** (modal form) → updates title/image/ingredients/readyIn
  - **Delete** → removes from DB and refreshes list

---

## Styling

- **Flexbox-only** layout (no grid)
- **Sticky navbar** with blurred hero background
- **Footer pinned** to the bottom via flex column layout
- Warm, restaurant-style palette (pumpkin/orange + basil green)
- Google Font: **Inter**

---

## Error Handling

- **Backend**
  - Missing API key or DB connection → 500 JSON:
    ```json
    { "status": "error", "message": "Internal Server Error" }
    ```
    (Actual propagated messages are included when available.)
  - Unique constraint violation → **409** JSON:
    ```json
    { "status": "fail", "message": "This recipe is already in your favorites." }
    ```
- **Frontend**
  - Each fetch/axios call checks status and shows human-friendly text in
    `#status`, `#random-status`, `#favorites-status`.
  - On duplicate save, buttons show **“Already saved ✓”** and may also `alert(...)`.

---

## Scripts

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

- Spoonacular’s free tier has daily quotas. During development, keep `limit` small and avoid auto-fetch loops.
- All external calls are **browser → Express → Spoonacular**, so the API key stays secret.
- Favorites are **unique by title (case-insensitive)** by default; adjust the index if you prefer a different rule.

---

## Credits

- Data: **Spoonacular API**
- Hero photo: **Unsplash**

---

## Student Reflection

### Time Spent

~10 hours total:

- ~3h backend routes + DB CRUD
- ~2h Postgres setup + migrations
- ~2h modular frontend refactor
- ~2h styling & modal polish
- ~1h debugging duplicates & README

### Challenges

- Handling invalid historic data while migrating `ingredients` to **JSONB**
- Enforcing unique favorites (case-insensitive index + catching `23505` → 409)
- Keeping the frontend modular without overcomplicating build tooling
- Working around Spoonacular quota errors during testing
