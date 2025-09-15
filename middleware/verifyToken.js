require("dotenv").config();
const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  try {
    // get authorization header
    const auth = req.headers.authorization || "";

    // split the header
    const [type, token] = auth.split(" ");

    // check if the token is valid
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // verify the token
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // attach the user to the request
    req.user = {
      id: payload.id,
      email: payload.email,
      username: payload.username,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = verifyToken;
