const router = require("express").Router();

router.get("/", (_, res) => {
  res.json({ message: "API working" });
});

module.exports = router;
