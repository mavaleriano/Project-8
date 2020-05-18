var express = require('express');
var router = express.Router();
var Book = require("../models").Book;
const { Op } = require('../models').Sequelize;

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

const booksPerPage = 6;

function pagination (books, link) {
  let newBooksArray = [];
  let start = (link - 1) * booksPerPage;
  let end = start + booksPerPage;
  if (end > books.length)
  {
    end = books.length;
  }

  for (let i = start; i < end; i = i + 1)
  {
    newBooksArray.push(books[i]);
  }
  return newBooksArray;
}

/* Shows the full list of books*/ //the /books redirect is in index.js
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order: [['author', 'ASC']] });
  let links = (books.length / booksPerPage);

  res.render("books/index", {books: books, title: "Books", links});
}));

/* Shows the full list of books*/ //the /books redirect is in index.js
router.post('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order: [['author', 'ASC']] });
  let links = books.length / booksPerPage; //The reason this works is because in index.pug im iterating +1 each time so even if it's decimal it shows up correctly
  let subBooks;
  if (req.body.link === "Show All")
  {
    subBooks = books;
  }
  else 
  {
    subBooks = pagination(books, req.body.link);
  }
  
  res.render("books/index", {books: subBooks, title: "Books", links});
}));

/* Shows the create new book form */
router.get('/new', asyncHandler(async (req, res) => {
  let home = true;
  res.render("books/new-book", { book: {}, title: "New Book", home });
}));

/* Posts a new book to the database */
// Used 'Using Sequelize ORM with Express' teamhouse project to help with much of this
router.post('/new', asyncHandler(async (req, res) => {
  console.log(req);
  let book;
  try {
    book = await Book.create(req.body);
    console.log(req.body);
    res.redirect("/books");
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

/* Searching for specific values */
// https://sequelize.org/v4/manual/tutorial/querying.html#range-operators
// https://www.w3schools.com/sql/sql_wildcards.asp
router.post('/search', asyncHandler(async (req, res) => {
  let home = true;


  try {
    const books = await Book.findAll({
        where: {
          [Op.or]: {
            title: 
            {
              [Op.like]: `%${req.body.query}%`
            },
            author:
            {
              [Op.like]: `%${req.body.query}%`
            },
            genre:
            {
              [Op.like]: `%${req.body.query}%`
            },
            year:
            {
              [Op.like]: `%${req.body.query}%`
            }
          }
        }
      }
    );
    let links = books.length / booksPerPage;
    res.render("books/index", {books: books, title: "Books", home, links});
  }
  catch(error){
    throw error;
  }
}));

/* Shows book detail form */
router.get('/:id', asyncHandler(async (req, res) => {
  try{
    console.log("Step 1: ");
    const book = await Book.findByPk(req.params.id);

    res.render("books/update-book", {book, title: book.title} );
  }
  catch (error) {
    if (error.name === "TypeError")
    {
      res.render("books/page-not-found", {errors: error.errors})
    }

    console.log(error.status);
    throw error;
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
      res.redirect("/books");
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
