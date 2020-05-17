var express = require('express');
var router = express.Router();

/* Home route should redirect to the /books route */
router.get('/', (req, res, next) => {
  res.redirect('/books');
});

module.exports = router;
