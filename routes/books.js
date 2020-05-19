var express = require('express');
var router = express.Router();
var Book = require("../models").Book;
const { Op } = require('../models').Sequelize;

/**
 * SQL Library Manager
 * Aiming for Exceeds Expectations!
 */

/**
 * @param {int} booksPerPage: Controls number of books, in main results and search results
 * @param {bool} showAll: Controls if the full list of books is displayed
 * @param {arrayOfbooks} temp: Holds the books from search results to paginate correctly
 * @param {bool} searched: Gets set in .post('/search) and gets used in .post('/') to render correct results for pagination
 */
const booksPerPage = 5;
let showAll = true;
let temp;
let searched;

/* Handler function to wrap each route. */
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error)
    {
      next(error);
    }
  }
}

/**
 * Function takes the array of books and return a subarray (newBooksArray)
 * The subarray depends on the page link that was clicked
 * @param {int} start: initial value of the books array that will be saved
 * @param {int} end: stopping value of the book array (one less than this value)
 */
function pagination (books, link = 1) {
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

/* Shows the full list of books
*  the /books redirect is in index.js
*  Calls Book.findAll to retrieve all books
*  Uses links to help set up bottom links
*/
router.get('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order: [['author', 'ASC']] });
  let links = (books.length / booksPerPage);
  let choice = 1;
  showAll = false;
  let pagiBooks = pagination(books, choice);
  res.render("books/index", {books: pagiBooks, title: "Books", links, showAll, choice});
}));

/** 
 * Shows the full list of books according to page link clicked
 * Gets called every time a link for pagination gets clicked
 * Renders the correct subArray or all, even as a search result
 * @param subBooks: saves resulting subArray from pagination into subBooks
 * @param choice: set to the value of the link that was clicked
 * @param links: Calculates the correct number of links for pagination
*/
router.post('/', asyncHandler(async (req, res) => {
  const books = await Book.findAll({ order: [['author', 'ASC']] });
  let links = books.length / booksPerPage; //The reason this works is because in index.pug im iterating +1 each time so even if it's decimal it shows up correctly
  let subBooks;
  let choice = parseInt(req.body.link);
  if (req.body.link === "Show All")
  {
    subBooks = books;
    showAll = true;
    searched = false;
  }
  else 
  {
    if (searched)
    {
      subBooks = pagination(temp, req.body.link);
      links = temp.length / booksPerPage;
    }
    else
    {
      subBooks = pagination(books, req.body.link);
    }

    showAll = false;
  }
  res.render("books/index", {books: subBooks, title: "Books", links, showAll, choice});
}));

/* Shows the create new book form */
router.get('/new', asyncHandler(async (req, res) => {
  res.render("books/new-book", { book: {}, title: "New Book" });
}));

/* Posts a new book to the database */
// Used 'Using Sequelize ORM with Express' teamhouse project to help with much of this
/**
 * Tries to post new form
 * If fail due to validation, it re-renders with errors
 * Else throws error
 */
router.post('/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect("/books");
  }
  catch(error){
    if (error.name === "SequelizeValidationError")
    {
      book = await Book.build(req.body);
      res.render("books/new-book", { book, errors: error.errors, title: "New Book"} );
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
// Returns a books result with the specified search query
// Creates pagination based on the result
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
    temp = books;
    let links = books.length / booksPerPage;
    let subBooks;
    let choice = parseInt(req.body.link);
    searched = true;
    if (req.body.link === "Show All")
    {
      showAll = true;
      subBooks = books;
    }
    else 
    {
      subBooks = pagination(books, req.body.link);
      if (!req.body.link) // in the case there's a search and no link is clicked
      {
        choice = 1;
      }
      showAll = false;
    }
    res.render("books/index", {books: subBooks, title: "Books", home, links, showAll, choice, searched});
  }
  catch(error){
    throw error;
  }
}));

/* Shows book detail form or renders error */
router.get('/:id', asyncHandler(async (req, res) => {
  try{
    const book = await Book.findByPk(req.params.id);
    res.render("books/update-book", {book, title: book.title} );
  }
  catch (error) 
  {
    res.render("page-not-found", { error: error } );
  }
}));

/** 
 * Updates book info in the database 
 * Posts the resulting edit from the edit page or renders the errors page
 */
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
  catch (error)
  {
    if (error.name === "SequelizeValidationError") 
    {
      book = await Book.build(req.body);
      book.id = req.params.id; // Make sure correct book gets updated
      res.render("books/update-book", {book, errors: error.errors, title: "Edit Book"});
    }
    else
    {
      throw error;
    }
  }
}));

/* Deletes a book. Careful, this can't be undone: Add new test to to test delete */
/**
 * Chooses based on PK and destroys book
 */
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
