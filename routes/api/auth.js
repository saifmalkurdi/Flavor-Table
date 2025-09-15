require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ================= helper functions ======================= //

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

// ========= Post => api/auth/register =================== //

router.post("/register", async (req, res, next) => {
  // get db = pool
  const { db } = req.app.locals;

  try {
    // get the request body
    const { username, email, password } = req.body;

    // check if all fields are filled
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email, password are required" });
    }

    // Unique check
    const exists = await db.query(
      "SELECT 1 FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );
    if (exists.rows.length) {
      return res
        .status(409)
        .json({ message: "Email or username already in use" });
    }

    // hash the password
    const hash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 12
    );

    // create the user
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1,$2,$3)
       RETURNING id, username, email`,
      [username, email, hash]
    );
    // get the user
    const user = rows[0];

    // sign the token
    const token = signToken(user);

    // send the response
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// ======================== login => api/auth/login =========================== //

router.post("/login", async (req, res, next) => {
  // get db = pool
  const { db } = req.app.locals;

  // get the request body
  const { username, emailOrUsername, password } = req.body;

  // check if all fields are filled
  if (!(username || emailOrUsername) || !password) {
    return res
      .status(400)
      .json({ message: "username/email and password are required" });
  }

  const identifier = username || emailOrUsername;

  // get the user
  const { rows } = await db.query(
    `SELECT id, username, email, password
       FROM users
       WHERE username=$1 OR email=$1`,
    [identifier]
  );

  // check if the user exists
  if (!rows.length) return res.status(404).json({ message: "User not found" });

  // get the user from the db
  const user = rows[0];

  // check if the password is correct
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  // sign the token
  const token = signToken(user);

  // send the response
  res.status(200).json({
    token,
    user: { id: user.id, username: user.username, email: user.email },
  });

  try {
  } catch (err) {
    next(err);
  }
});

module.exports = router;
