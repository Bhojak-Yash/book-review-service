const dbConfig = require("../config/db");
// import { Sequelize,Op } from "sequelize";
const users = require('./users')
const manufacturers = require('./manufacturers')
const orders = require('./orders')
const stocks = require('./stocks')
const items = require('./orderitems')
const pharmacies = require('./retailers')
const loginLogs = require('./loginlogs')
const inquiry = require('./inquiry')
const products = require('./products')
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
  orders: orders(sequelize, Sequelize),
  items: items(sequelize, Sequelize),
  pharmacies: pharmacies(sequelize, Sequelize),
  loginLogs:loginLogs(sequelize,Sequelize),
  inquiry:inquiry(sequelize,Sequelize),
  products:products(sequelize,Sequelize),
  stocks:stocks(sequelize,Sequelize)
};



// db.pharmacies.hasMany(db.orders, { foreignKey: 'pharmacyId', sourceKey: 'pharmacyId' });
// db.orders.belongsTo(db.pharmacies, { foreignKey: 'pharmacyId', targetKey: 'pharmacyId' });

// db.orders.hasMany(db.items, { foreignKey: 'orderId', sourceKey: 'orderId' });
// db.items.belongsTo(db.orders, { foreignKey: 'orderId', targetKey: 'orderId' });

db.stocks.belongsTo(db.products, {
  foreignKey: 'PId',
  as: 'product',
});
db.products.hasMany(db.stocks, {
  foreignKey: 'PId',
});



module.exports = db;