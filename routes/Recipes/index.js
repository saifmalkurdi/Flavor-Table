const express = require("express");
const router = express.Router();

const randomRouter = require("./random");
const searchRouter = require("./search");
const detailsRouter = require("./details");

router.use("/random", randomRouter);
router.use("/search", searchRouter);
router.use("/", detailsRouter);

module.exports = router;
