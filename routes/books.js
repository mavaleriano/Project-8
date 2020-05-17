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
// Used 'Using Sequelize ORM with Express' teamhouse project to help with much of this
router.post('/', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    console.log(book);
    res.redirect("/books/" + book.id);
  }
  catch(error){
    if (error.name === "SequelizeValidationError")
    {
      console.log(error.name);
      article = await Book.build(req.body);
      res.render("books/new-book", { article, errors: error.errors, title: "New Book"})
    }
    else
    {
      throw error;  //error caught in asyncHandler's catch block
    }
  }
}));

/* Shows book detail form */
router.get('/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book)
  {
    res.render("books/update-book", {book, title: book.title} );
  }
  else
  {
    res.sendStatus(404);
  }
}));

/* Updates book info in the database */
router.post('/:id/edit', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if (book)
    {
      await book.update(req.body);
      res.redirect("/books/" + book.id);
    }
    else
    {
      res.sendStatus(404);
    }
  }
  catch
  {
    if (error.name === "SequelizeValidationError") 
    {
      book = await Book.build(req.body);
      book.id = req.params.id; // Make sure correct article gets updated
      res.render("books/update-book", {book, errors: error.errors, title: "Edit Book"})
    }
    else
    {
      throw error;
    }
  }
}));

/* Deletes a book. Careful, this can't be undone: Add new test to to test delete */
router.post('/:id/delete', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if (book) 
  {
    await book.destroy();
    res.redirect("/books");
  }
  else
  {
    res.sendStatus(404);
  }
}));

module.exports = router;
