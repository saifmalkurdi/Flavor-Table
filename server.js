require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");

const homeRouter = require("./routes/home");
const recipesRouter = require("./routes/Recipes");
const apiRecipesRouter = require("./routes/api/recipes");

// app
const app = express();

// Warnings for missing env vars
if (!process.env.SPOONACULAR_API_KEY) {
  console.warn(
    "⚠️  SPOONACULAR_API_KEY is not set. /recipes routes will fail."
  );
}

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set. DB-backed features will fail.");
}

// middleware
app.use(cors());
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, "./public")));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.locals.db = pool;

// routes
app.use("/", homeRouter);
app.use("/recipes", recipesRouter);
app.use("/api/recipes", apiRecipesRouter);

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ status: "fail", message: "Not Found" });
});

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    status: "error",
    message:
      err.response?.data?.message || err.message || "Internal Server Error",
  });
});

// port
const PORT = process.env.PORT || 5000;
// server
async function start() {
  try {
    await app.locals.db.query("SELECT 1"); // triggers a real connection
    console.log("✅ Connected to PostgreSQL");

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ PostgreSQL connection failed:", err.message);
    process.exit(1); // stop here so you don’t run a server without DB
  }
}

start();
