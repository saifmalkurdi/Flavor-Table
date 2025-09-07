const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = process.env.BASE_URL;

router.get("/", async (req, res, next) => {
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

module.exports = router;
