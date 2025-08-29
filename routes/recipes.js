const express = require("express");
const axios = require("axios");
const router = express.Router();

API_KEY = process.env.SPOONACULAR_API_KEY;
BASE_URL = "https://api.spoonacular.com";

router.get("/random", async (req, res, next) => {
  try {
    // check if API_KEY is set
    if (!API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Server missing SPOONACULAR_API_KEY",
      });
    }

    // get random recipe
    const { data } = await axios.get(`${BASE_URL}/recipes/random`, {
      params: {
        apiKey: API_KEY,
        number: 1,
      },
    });

    // return recipe
    const recipe = data?.recipes?.[0];

    // check if recipe exists
    if (!recipe) {
      return res
        .status(404)
        .json({ status: "fail", message: "No recipe found" });
    }

    const instructions =
      recipe?.analyzedInstructions?.[0]?.steps?.map((s) => s.step).join(" ") ||
      recipe?.instructions ||
      "";

    const ingredients = (recipe?.extendedIngredients || [])
      ?.map((i) => i.original || i.name)
      .filter(Boolean);

    res.json({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      instructions,
      ingredients,
    });

    // catch errors
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    // check if the ingredients query parameter is set
    // raw Makes it clear this value hasn’t been cleaned or validated yet
    const raw = req.query.ingredients;
    if (!raw || String(raw).trim() === "") {
      return res.status(400).json({
        status: "fail",
        message: 'Query parameter "ingredients" is required (comma-separated).',
      });
    }

    //sanitize
    const ingredients = String(raw)
      .split(",")
      .map((i) => i.trim().toLocaleLowerCase())
      .filter(Boolean)
      .join(",");

    const number = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    // get recipes
    const { data } = await axios.get(`${BASE_URL}/recipes/findByIngredients`, {
      params: {
        apiKey: API_KEY,
        ingredients,
        number,
      },
    });

    // return recipes
    const results = (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredients: (r.usedIngredients || []).map((i) => i.name),
      missedIngredients: (r.missedIngredients || []).map((i) => i.name),
    }));

    res.json(results);

    // catch errors
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // get the id from the url
    const { id } = req.params;

    // test id is valid using regex
    if (!/^\d+$/.test(id)) {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid recipe id" });
    }

    // get recipe details
    const { data } = await axios.get(`${BASE_URL}/recipes/${id}/information`, {
      params: { apiKey: API_KEY, includeNutrition: false },
    });

    // Spoonacular summary is HTML -> strip tags for clean text
    const summaryText = (data.summary || "").replace(/<[^>]*>/g, "");

    res.json({
      id: data.id,
      title: data.title,
      image: data.image,
      summary: summaryText,
      readyInMinutes: data.readyInMinutes,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
