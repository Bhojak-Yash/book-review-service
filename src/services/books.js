const db = require('../models/db');
// const redisClient = require('../config/redis');
const Books = db.books;
const Reviews = db.reviews;

exports.getAllBooks = async () => {
  try {
    let cachedBooks = null;

    // Uncomment and configure this when Redis is available
    // if (redisClient) {
    //   cachedBooks = await redisClient.get('books');
    // }

    if (cachedBooks) {
      return {
        status: 200,
        message: "Data fetched from cache",
        fromCache: true,
        data: JSON.parse(cachedBooks)
      };
    }

    const books = await Books.findAll();

    // Uncomment to set cache once Redis is configured
    // if (redisClient) {
    //   await redisClient.set('books', JSON.stringify(books));
    // }

    return {
      status: 200,
      message: "Data fetched from database",
      fromCache: false,
      data: books
    };
  } catch (error) {
    console.error("Service Error [getAllBooks]:", error.message);
    throw error;
  }
};


exports.createBook = async (title, author) => {
  try {
    const bookSignature = title.trim().toUpperCase().replace(/\s+/g, '_');

    const existingBook = await Books.findOne({ where: { bookSignature } });
    if (existingBook) {
      return {
        status: 400,
        message: "A book with the same name already exists."
      };
    }

    const newBook = await Books.create({ 
      title, 
      author, 
      bookSignature 
    });

    // if (redisClient) await redisClient.del('books');

    return {
      status: 200,
      message: "New book created successfully.",
      newBook
    };
  } catch (error) {
    console.error("Service Error [createBook]:", error.message);
    throw error;
  }
};


exports.getBookReviews = async (bookId) => {
  try {
    const reviews = await Reviews.findAll({ where: { bookId } });
    return {
      status: 200,
      message: "Data fetched Successfully",
      data: {
        reviews
      }
    };
  } catch (error) {
    console.error("Service Error [getBookReviews]:", error.message);
    throw error;
  }
};

exports.createReview = async (bookId, rating, comment) => {
  try {
    const review = await Reviews.create({ rating, comment, bookId });
    return {
      status: 200,
      message: "Review Created Successfully",
      data: {
        review
      }
    };
  } catch (error) {
    console.error("Service Error [createReview]:", error.message);
    throw error;
  }
};
