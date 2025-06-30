const redisClient = require('../config/redis');
const db = require('../models/db');
const Books = db.books;
const Reviews = db.reviews;

exports.getAllBooks = async () => {
  try {
    const cacheKey = 'books';
    let cachedBooks = null;

    try {
      cachedBooks = await redisClient.get(cacheKey);
    } catch (err) {
      console.warn("Redis failed, falling back to DB");
    }

    if (cachedBooks) {
      return {
        status: 200,
        message: "Data fetched from cache",
        fromCache: true,
        data: JSON.parse(cachedBooks)
      };
    }

    const books = await Books.findAll();

    try {
      await redisClient.set(cacheKey, JSON.stringify(books));
    } catch (err) {
      console.warn("Redis set failed");
    }

    return {
      status: 200,
      message: "Data fetched from database",
      fromCache: false,
      data: books
    };
  } catch (error) {
    console.error("Service Error [getAllBooks]:", error.message);
    throw {
      status: 500,
      message: "Internal Server Error while fetching books"
    };
  }
};

exports.createBook = async (title, author) => {
  try {
    if (!title || !author) {
      return {
        status: 400,
        message: "Both title and author are required."
      };
    }

    const bookSignature = title.trim().toUpperCase().replace(/\s+/g, '_');
    const existingBook = await Books.findOne({ where: { bookSignature } });

    if (existingBook) {
      return {
        status: 400,
        message: "A book with the same title already exists."
      };
    }

    const newBook = await Books.create({ title, author, bookSignature });

    try {
      await redisClient.del('books');
    } catch (err) {
      console.warn("Redis delete failed");
    }

    return {
      status: 201,
      message: "New book created successfully.",
      data: newBook
    };
  } catch (error) {
    console.error("Service Error [createBook]:", error.message);
    throw {
      status: 500,
      message: "Internal Server Error while creating book"
    };
  }
};

exports.getBookReviews = async (bookId) => {
  try {
    if (!bookId || isNaN(bookId)) {
      return {
        status: 400,
        message: "Valid bookId is required."
      };
    }

    const book = await Books.findByPk(bookId);
    if (!book) {
      return {
        status: 404,
        message: "Book not found with the provided ID."
      };
    }

    const cacheKey = `reviews_book_${bookId}`;
    let cachedReviews = null;

    try {
      cachedReviews = await redisClient.get(cacheKey);
    } catch (err) {
      console.warn("Redis failed, falling back to DB for reviews");
    }

    if (cachedReviews) {
      return {
        status: 200,
        message: "Reviews fetched from cache.",
        fromCache: true,
        data: JSON.parse(cachedReviews)
      };
    }

    const reviews = await Reviews.findAll({ where: { bookId } });

    try {
      await redisClient.set(cacheKey, JSON.stringify(reviews));
    } catch (err) {
      console.warn("Redis set failed for reviews");
    }

    return {
      status: 200,
      message: "Reviews fetched from database.",
      fromCache: false,
      data: reviews
    };
  } catch (error) {
    console.error("Service Error [getBookReviews]:", error.message);
    throw {
      status: 500,
      message: "Internal Server Error while fetching reviews"
    };
  }
};

exports.createReview = async (bookId, rating, comment) => {
  try {
    if (!bookId || isNaN(bookId)) {
      return {
        status: 400,
        message: "Valid bookId is required."
      };
    }

    if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
      return {
        status: 400,
        message: "Rating must be a number between 1 and 5."
      };
    }

    const book = await Books.findByPk(bookId);
    if (!book) {
      return {
        status: 404,
        message: "Cannot create review: Book not found."
      };
    }

    const review = await Reviews.create({ rating, comment, bookId });

    try {
      await redisClient.del(`reviews_book_${bookId}`);
    } catch (err) {
      console.warn("Redis delete failed for reviews");
    }

    return {
      status: 201,
      message: "Review created successfully.",
      data: review
    };
  } catch (error) {
    console.error("Service Error [createReview]:", error.message);
    throw {
      status: 500,
      message: "Internal Server Error while creating review"
    };
  }
};