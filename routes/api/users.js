require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const verifyToken = require("../../middleware/verifyToken");

const router = express.Router();

// ===================== GET /api/users/profile ====================== //

router.get("/profile", verifyToken, async (req, res, next) => {
  // get db = pool
  const { db } = req.app.locals;

  try {
    // get the user from the db
    const { rows } = await db.query(
      "SELECT id, username, email, created_at FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ===================== PUT /api/users/profile ====================== //

router.put("/profile", verifyToken, async (req, res, next) => {
  // get db = pool
  const { db } = req.app.locals;

  try {
    // get the request body
    const { username, email } = req.body;

    // check if all fields are filled
    if (!username && !email) {
      return res.status(400).json({ message: "Nothing to update" });
    }

    // enforce uniqueness
    if (email || username) {
      const someoneElse = await db.query(
        "SELECT 1 FROM users WHERE id<>$1 AND (email=$2 OR username=$3)",
        [req.user.id, email || null, username || null]
      );
      if (someoneElse.rows.length) {
        return res
          .status(409)
          .json({ message: "Email or username already in use" });
      }
    }

    // get the user from the db
    const { rows } = await db.query(
      `UPDATE users
         SET username=COALESCE($1, username),
             email=COALESCE($2, email)
       WHERE id=$3
       RETURNING id, username, email, created_at`,
      [username || null, email || null, req.user.id]
    );

    // response with the updated user
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// ===================== PUT /api/users/password ====================== //

router.put("/password", verifyToken, async (req, res, next) => {
  // get db = pool
  const { db } = req.app.locals;

  try {
    // get the request body
    const { currentPassword, newPassword } = req.body;

    // check if all fields are filled
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "currentPassword and newPassword are required" });
    }

    // get the user from the db
    const { rows } = await db.query("SELECT password FROM users WHERE id=$1", [
      req.user.id,
    ]);

    // check if the password is correct
    const ok = await bcrypt.compare(currentPassword, rows[0].password);
    if (!ok)
      return res.status(401).json({ message: "Current password is incorrect" });

    // hash the password
    const hash = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS || 12)
    );

    // update the passord
    await db.query("UPDATE users SET password=$1 WHERE id=$2", [
      hash,
      req.user.id,
    ]);
    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
