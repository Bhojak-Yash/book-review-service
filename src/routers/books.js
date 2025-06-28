const express = require('express');
const router = express.Router();
const booksController = require('../controllers/books');

router.get('/books', booksController.getAllBooks);
router.post('/books', booksController.addBook);
router.get('/books/reviews/:id', booksController.getReviews);
router.post('/books/reviews/:id', booksController.addReview);

module.exports = router;