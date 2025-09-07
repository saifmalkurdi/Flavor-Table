const express = require("express");
const router = express.Router();

/* =========================
   GET /api/recipes
   ========================= */
router.get("/", async (req, res, next) => {
  const { db } = req.app.locals;
  try {
    const { rows } = await db.query(
      `SELECT id, title, image, instructions, ingredients,
              readyin AS "readyIn"
       FROM recipes
       ORDER BY id DESC;`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/* =========================
   POST /api/recipes
   ========================= */
router.post("/", async (req, res, next) => {
  const { db } = req.app.locals;
  try {
    const { title, image, instructions } = req.body;
    const incomingIngredients = req.body.ingredients;
    const readyIn = req.body.readyIn ?? req.body.readyin ?? null;

    const cleanTitle = (title || "").trim();
    if (!cleanTitle) {
      return res
        .status(400)
        .json({ status: "fail", message: "title is required" });
    }

    const ingredientsJson = JSON.stringify(
      Array.isArray(incomingIngredients) ? incomingIngredients : []
    );

    const { rows } = await db.query(
      `INSERT INTO recipes (title, image, instructions, ingredients, readyin)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING id, title, image, instructions, ingredients, readyin AS "readyIn";`,
      [
        cleanTitle,
        image || null,
        instructions || null,
        ingredientsJson,
        readyIn,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({
        status: "fail",
        message: "This recipe is already in your favorites.",
      });
    }
    next(err);
  }
});

/* =========================
   PUT /api/recipes/:id
   ========================= */
router.put("/:id", async (req, res, next) => {
  const { db } = req.app.locals;
  try {
    const { id } = req.params;

    const { title, image, instructions } = req.body;
    const incomingIngredients = req.body.ingredients;
    const readyIn = req.body.readyIn ?? req.body.readyin ?? null;

    const cleanTitle = (title || "").trim();
    if (!cleanTitle) {
      return res
        .status(400)
        .json({ status: "fail", message: "title is required" });
    }

    const ingredientsJson = JSON.stringify(
      Array.isArray(incomingIngredients) ? incomingIngredients : []
    );

    const { rows } = await db.query(
      `UPDATE recipes
         SET title=$1,
             image=$2,
             instructions=$3,
             ingredients=$4::jsonb,
             readyin=$5
       WHERE id=$6
       RETURNING id, title, image, instructions, ingredients, readyin AS "readyIn";`,
      [
        cleanTitle,
        image || null,
        instructions || null,
        ingredientsJson,
        readyIn,
        id,
      ]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ status: "fail", message: "Recipe not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err && err.code === "23505") {
      return res.status(409).json({
        status: "fail",
        message: "Another favorite with this title already exists.",
      });
    }
    next(err);
  }
});

/* =========================
   DELETE /api/recipes/:id
   ========================= */
router.delete("/:id", async (req, res, next) => {
  const { db } = req.app.locals;
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "DELETE FROM recipes WHERE id=$1 RETURNING id;",
      [id]
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ status: "fail", message: "Recipe not found" });
    }
    res.json({ status: "ok", id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
