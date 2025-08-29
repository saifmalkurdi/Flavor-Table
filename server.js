const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const homeRouter = require("./routes/home");
const recipesRouter = require("./routes/recipes");

// app
const app = express();

// API keys check
if (!process.env.SPOONACULAR_API_KEY) {
  console.warn(
    "⚠️  SPOONACULAR_API_KEY is not set. /recipes routes will fail."
  );
}

// middleware
app.use(cors());
app.use(express.json());

// static files
app.use(express.static(path.join(__dirname, "./public")));

// routes
app.use("/", homeRouter);
app.use("/recipes", recipesRouter);

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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
