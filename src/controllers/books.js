const bookService = require('../services/books');

exports.getAllBooks = async (req, res) => {
  try {
    const result = await bookService.getAllBooks();
    res.status(200).json(result);
  } catch (error) {
    console.error("Controller Error [getAllBooks]:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
};

exports.addBook = async (req, res) => {
  try {
    const { title, author } = req.body;
    const newBook = await bookService.createBook(title, author);
    res.status(201).json(newBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add book' });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await bookService.getBookReviews(id);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const review = await bookService.createReview(id, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add review' });
  }
};
