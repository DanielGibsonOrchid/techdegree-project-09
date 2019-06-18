const express = require('express');
const router = express.Router();

// Redirect to /api/users
router.get("/", (req, res) => {
  res.redirect("/api/users");
});

module.exports = router;