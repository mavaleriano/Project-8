var express = require('express');
var router = express.Router();
var Book = require("../models").Book;

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      res.status(500).send(error);
    }
  }
}

/* Shows the full list of books*/ //the /books redirect is in index.js
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll();
  res.render("books/index", {books: books, title: "Books"});
}));

/* Shows the create new book form */
router.get('/new', asyncHandler(async (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
}));

/* Posts a new book to the database */
router.post('/new', asyncHandler(async (req, res) => {}));

/* Shows book detail form */
router.get('/:id', asyncHandler(async (req, res) => {}));

/* Updates book info in the database */
router.post('/:id', asyncHandler(async (req, res) => {}));

/* Deletes a book. Careful, this can't be undone: Add new test to to test delete */
router.post('/:id/delete', asyncHandler(async (req, res) => {}));

module.exports = router;
