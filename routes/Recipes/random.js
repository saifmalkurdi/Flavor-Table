const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = process.env.BASE_URL;

router.get("/", async (_req, res, next) => {
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
      params: { apiKey: API_KEY, number: 1 },
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
      .map((i) => i.original || i.name)
      .filter(Boolean);

    res.json({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      instructions,
      ingredients,
      readyInMinutes: recipe.readyInMinutes ?? null,
    });

    // catch errors
  } catch (error) {
    next(error);
  }
});

module.exports = router;
