const Sequelize = require("sequelize");
const dbConfig = require("../config/db");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  port: dbConfig.PORT,
  dialect: 'mysql',
  // operatorsAliases: false,
  pool: dbConfig.pool,
  logging: false
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.books = require("./books")(sequelize, Sequelize);
db.reviews = require("./review")(sequelize, Sequelize);

db.books.hasMany(db.reviews, {
  foreignKey: 'bookId',
  as: 'reviews',
  onDelete: 'CASCADE',
});
db.reviews.belongsTo(db.books, {
  foreignKey: 'bookId',
  as: 'book',
});

module.exports = db;
