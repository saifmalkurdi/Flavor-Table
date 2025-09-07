const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = process.env.BASE_URL;

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
