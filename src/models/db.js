const dbConfig = require("../config/db");
// import { Sequelize,Op } from "sequelize";
const users = require('./users')
const manufacturers = require('./manufacturers')
const orders = require('./orders')
const stocks = require('./stocks')
const orderitems = require('./orderitems')
const retailers = require('./retailers')
const distributors = require('./distributors')
const loginLogs = require('./loginlogs')
const inquiry = require('./inquiry')
const products = require('./products')
const usercarts = require('./usercarts')
const employees = require('./employees')
const entities = require('./entities')
const roles = require('./roles')
const authorizations = require('./authorizations')
const address = require('./address')
const documentCategory = require('./documentCategory')
const documents = require('./documents')
const ss = require('sequelize')
const Sequelize = ss.Sequelize
const Op = ss.Op

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: 'mysql',
      timezone: '+05:30',
    logging: false,
    pool: {
      max: dbConfig.pool.max,
      min: dbConfig.pool.min,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  }
);

const db = {
  Sequelize: Sequelize,
  sequelize: sequelize,
  Op: Op,
  users: users(sequelize, Sequelize),
  manufacturers: manufacturers(sequelize, Sequelize),
  distributors: distributors(sequelize, Sequelize),
  retailers: retailers(sequelize, Sequelize),
  orders: orders(sequelize, Sequelize),
  orderitems: orderitems(sequelize, Sequelize),
 // pharmacies: pharmacies(sequelize, Sequelize),
  loginLogs:loginLogs(sequelize,Sequelize),
  inquiry:inquiry(sequelize,Sequelize),
  products:products(sequelize,Sequelize),
  stocks:stocks(sequelize,Sequelize),
  usercarts:usercarts(sequelize,Sequelize),
  authorizations:authorizations(sequelize,Sequelize),
  employees:employees(sequelize,Sequelize),
  entities:entities(sequelize,Sequelize),
  roles:roles(sequelize,Sequelize),
  address:address(sequelize,Sequelize),
  documentCategory:documentCategory(sequelize,Sequelize),
  documents:documents(sequelize,Sequelize)
};


db.stocks.belongsTo(db.products, {
  foreignKey: 'PId',
  as: 'product',
});
db.products.hasMany(db.stocks, {
  foreignKey: 'PId',
});

db.usercarts.belongsTo(db.products, { foreignKey: 'PId', as: 'productDetails' });
db.products.hasMany(db.usercarts, { foreignKey: 'PId', as: 'cartItems' });
db.usercarts.belongsTo(db.stocks, { foreignKey: 'stockId', as: 'stockDetails' });
db.stocks.hasMany(db.usercarts, { foreignKey: 'stockId', as: 'cartItems' });
db.orders.belongsTo(db.users, { as: "orderToUser", foreignKey: "orderTo" });
db.orders.belongsTo(db.users, { as: "orderFromUser", foreignKey: "orderFrom" });
db.documentCategory.hasMany(db.documents, {foreignKey:'categoryId',as: 'documnets'})
db.documents.belongsTo(db.documentCategory, {foreignKey:'categoryId',as: 'documnets'})
db.orders.belongsTo(db.distributors, {
  foreignKey: 'orderFrom', // Ensure this is correct
  as: 'distributer'
});

// In distributors model
db.distributors.hasMany(db.orders, {
  foreignKey: 'orderFrom', // Ensure this is correct
  as: 'distributer'
});





//  sequelize.queryInterface.addConstraint('documents', {
//   fields: ['categoryId', 'userId'],
//   type: 'unique',
//   name: 'unique_category_user'
// });
module.exports = db;