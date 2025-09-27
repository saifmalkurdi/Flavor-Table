# Flavor Table

A tiny full-stack app that lets you **find recipes by ingredients**, get a **random recipe**, save **favorites** to a **PostgreSQL** database, and view **recipe details** in a modal.  
The backend proxies the Spoonacular API so your key stays private, and includes a simple **JWT auth** system (register/login, profile, change password).

---

## Tech Stack

- **Backend:** Node.js, Express, Axios, dotenv, pg, bcrypt, jsonwebtoken
- **Frontend:** Vanilla HTML/CSS/JS (Flexbox only), Google Fonts
- **Database:** PostgreSQL (local or Render managed)
- **Data Source:** Spoonacular API

---

## Live Demo :

URL => https://flavor-table-vkkz.onrender.com

---

## Project Structure

```
Flavor-Table/
├─ public/
│  ├─ index.html                 # Home (auth widgets + ingredients search UI)
│  ├─ favorites.html             # Favorites page (DB-backed)
│  ├─ randomRecipes.html         # Random recipe page
│  ├─ styles.css                 # Flexbox styling (fixed nav, bottom footer)
│  ├─ app.js                     # Frontend entry (boots modules)
│  ├─ auth.js                    # Login/register/logout + token helpers
│  ├─ DB/
│  │  └─ api.js                  # Frontend API calls to backend CRUD
│  ├─ modal_UI/
│  │  └─ modal.js                # Modal logic (details + edit form)
│  └─ recipes/
│     ├─ searchRandomRecipe.js   # Search by ingredients
│     ├─ showFavorites.js        # Favorites page renderer
│     ├─ showRandomRecipe.js     # Random page boot/render
│     └─ showRecipeDetail.js     # Fetch details + open modal
├─ routes/
│  ├─ home.js
│  ├─ Recipes/
│  │  ├─ index.js
│  │  ├─ random.js
│  │  ├─ search.js
│  │  └─ details.js
│  └─ api/
│     ├─ recipes.js
│     ├─ auth.js
│     └─ users.js
├─ middleware/
│  └─ verifyToken.js
├─ server.js
├─ .env                          # Secrets (not committed)
├─ .env.example
├─ package.json
└─ README.md
```

---

## Getting Started (Local)

### 1) Prerequisites

- Node.js **18+**
- PostgreSQL **14+**
- Spoonacular API key
- **pgAdmin 4** (GUI for PostgreSQL)

### 2) Install

```bash
npm install
```

### 3) Environment

Create `.env` in the project root (values are examples):

```dotenv
# Server
PORT=3000

# Spoonacular
SPOONACULAR_API_KEY=YOUR_KEY_HERE
BASE_URL=https://api.spoonacular.com

# Database (LOCAL EXAMPLE — adjust port if your local Postgres uses 5433)
DATABASE_URL=postgresql://user:password@localhost:5432/flavor_table

# Auth
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

> ⚠️ Never commit your real `.env`. Provide a `.env.example` with placeholders.

### 4) Create Tables with pgAdmin (Local)

1. Open **pgAdmin 4** → connect to your **local** server.
2. Create a database named **`flavor_table`** (if not already created).
3. Right-click the database → **Query Tool** → paste the **Schema SQL** below → **Execute** (►).
4. You should now see `users` and `recipes` tables under **Schemas → public → Tables**.

**Schema SQL (copy into pgAdmin):**

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email    TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Recipes (favorites)
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image TEXT,
  instructions TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  readyin INTEGER
);

-- Unique (case-insensitive) recipe titles
CREATE UNIQUE INDEX IF NOT EXISTS recipes_title_unique_idx
ON recipes (LOWER(title));
```

### 5) Run the server

```bash
npm run dev   # if you use nodemon
# or
node server.js
```

Open <http://localhost:3000>

---

## Deployment (Render.com — Free)

### A) Create a managed PostgreSQL (free tier)

1. Render Dashboard → **New → PostgreSQL**.
2. Choose region.
3. Plan: **Free**.
4. After it provisions, open the DB page and note:
   - **Internal Database URL** → used by the **web service** (no SSL).
   - **External Database URL** → used by **pgAdmin** on your laptop (requires SSL).

### B) Create the Web Service

1. **New → Web Service** → connect your GitHub repo.
2. **Branch**: main (or your choice).
3. **Environment**: `Node`.
4. **Build Command**: `npm ci` (or `npm install`)
5. **Start Command**: `node server.js`
6. **Instance type**: Free.
7. **Region**: **Same as your database**.

### C) Env Vars (on the Web Service)

```
# Render injects PORT; your server reads it
PORT=10000

# App secrets
SPOONACULAR_API_KEY=YOUR_KEY
BASE_URL=https://api.spoonacular.com
JWT_SECRET=<long_random_string>
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Use the DB **Internal** URL here
DATABASE_URL=<PASTE INTERNAL DATABASE URL>
NODE_ENV=production
```

### D) Create Tables on the Render DB using pgAdmin

1. In Render DB page, copy the **External Database URL** (contains host, db, user, password).
2. Open **pgAdmin → Add New Server**:
   - **General → Name:** `Render-Flavor-Table`
   - **Connection:** Host/DB/User/Password from the External URL, **Port:** 5432
   - **SSL:** Mode = **require** (leave certificates empty)
3. Connect → select the Render database → **Query Tool** → paste the **Schema SQL** (same as above) → **Execute**.
4. Verify `users` and `recipes` tables are created under **Schemas → public → Tables**.

> After the tables exist, your deployed app can read/write favorites immediately.

### E) Test your Render app

Open your Render URL (e.g., `https://flavor-table.onrender.com`) and try:

- `/` (Home)
- `/favorites.html`
- `/randomRecipes.html`
- `/recipes/random` (JSON health check)

> Free tier sleeps; the first request after idle will be slower (“cold start”).

---

## API Overview

### UI Proxy — `/recipes`

- `GET /recipes/random`
- `GET /recipes/search?ingredients=tomato,cheese&limit=12`
- `GET /recipes/:id`

### Auth — `/api/auth`

- `POST /api/auth/register` → `{ username, email, password }`
- `POST /api/auth/login` → `{ username, password }`

### Users — `/api/users` (JWT)

- `GET /api/users/profile`
- `PUT /api/users/profile`
- `PUT /api/users/password`

### Favorites — `/api/recipes` (JWT for write)

- `GET /api/recipes`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

> `POST/PUT/DELETE` require `Authorization: Bearer <token>`.

---

## Styling

- **Flexbox-only** layout (no grid)
- **Fixed, visible navbar** with media-query responsiveness (no JS)
- **Footer pinned** to the bottom via flex column layout
- Warm palette (pumpkin/orange + basil green); **Inter** font
- Buttons + focus rings use **brand** color

---

## Troubleshooting

- **401 on favorites** → Log in first and send `Authorization: Bearer <token>`.
- **Database connection error (Render)** →
  - Web service and DB must be in the **same region**.
  - Web service `DATABASE_URL` must be the **Internal URL**.
- **pgAdmin connection fails (Render)** → Use the **External URL** and set **SSL Mode: require**.
- **409 on save** → recipe title already exists (case-insensitive). Edit or delete the duplicate.

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

## Credits

- Data: **Spoonacular API**
- Hero photo: **Unsplash**
- UI/Code: **Saif Al Kurdi**

---

## Student Reflection

### Time Spent

~10 hours total:

- ~3h backend routes + DB CRUD
- ~2h Postgres setup + migrations (pgAdmin)
- ~2h modular frontend refactor
- ~2h styling & modal polish
- ~1h debugging duplicates & README

### Challenges

- Handling invalid historic data while migrating `ingredients` to **JSONB**
- Enforcing unique favorites (case-insensitive index + catching `23505` → 409)
- Keeping the frontend modular without overcomplicating build tooling
- Working around Spoonacular quota errors during testing
