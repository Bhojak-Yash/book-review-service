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
const payments = require('./payment')
const ss = require('sequelize')
const states = require('./states')
const cities = require('./cities')
const notifications = require('./notifications')
const returnHeader = require('./returnHeader');
const returnDetails = require('./returnDetails');
const creditNotes = require('./creditNotes');
const manufacturerStocks = require('./manufacturerStocks')
const moduleconfigs = require('./moduleconfigs')
const modulemappings = require('./modulemappings');
const retailerSalesHeader = require('./retailer_sales_header');
const retailerSalesDetails = require('./retailer_sales_details');
const patients = require('./patient');
const doctors =require('./doctors');
const doctorPayments = require('./doctorsPayments')
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
  documents:documents(sequelize,Sequelize),
  payments:payments(sequelize,Sequelize),
  states: states(sequelize, Sequelize),
  cities: cities(sequelize, Sequelize),
  notifications: notifications(sequelize, Sequelize),
  returnHeader:returnHeader(sequelize,Sequelize),
  returnDetails: returnDetails(sequelize, Sequelize),
  creditNotes: creditNotes(sequelize,Sequelize),
  manufacturerStocks:manufacturerStocks(sequelize,Sequelize),
  moduleconfigs: moduleconfigs(sequelize, Sequelize),
  modulemappings: modulemappings(sequelize, Sequelize),
  retailerSalesHeader:retailerSalesHeader(sequelize,Sequelize),
  retailerSalesDetails:retailerSalesDetails(sequelize,Sequelize),
  patients:patients(sequelize,Sequelize),
  doctors:doctors(sequelize,Sequelize),
  doctorPayments:doctorPayments(sequelize,Sequelize)
};

db.modulemappings.belongsTo(db.roles, { foreignKey: 'roleId' });
db.modulemappings.belongsTo(db.moduleconfigs, { foreignKey: 'moduleConfigId' });
db.roles.hasMany(db.modulemappings, { foreignKey: 'roleId' });
db.moduleconfigs.hasMany(db.modulemappings, { foreignKey: 'moduleConfigId' });
db.employees.belongsTo(db.roles, { foreignKey: 'roleId', as: 'role' });
db.roles.hasMany(db.employees, { foreignKey: 'roleId' });

db.manufacturers.hasOne(db.entities, {
  foreignKey: 'organisationId',
  sourceKey: 'manufacturerId'
});
db.distributors.hasOne(db.entities, {
  foreignKey: 'organisationId',
  sourceKey: 'distributorId'
});



db.stocks.belongsTo(db.products, {
  foreignKey: 'PId',
  as: 'product',
});
db.manufacturerStocks.belongsTo(db.products, {
  foreignKey: 'PId',
  as: 'product',
});
db.products.hasMany(db.stocks, {
  foreignKey: 'PId',
});
// db.products.hasMany(db.manufacturerStocks, {
//   foreignKey: 'PId',
// });
db.products.hasMany(db.manufacturerStocks, {
  foreignKey: 'PId',
  as: 'stockss',
});
db.products.hasMany(db.manufacturerStocks, {
  foreignKey: 'PId',
});
// db.manufacturerStocks.belongsTo(db.products,{foreignKey:'PId',as:"stocks"})
db.authorizations.belongsTo(db.distributors, { foreignKey: 'authorizedId', as: 'distributors' });
db.authorizations.belongsTo(db.retailers, { foreignKey: 'authorizedId', as: 'retailers' });
db.authorizations.belongsTo(db.distributors, { foreignKey: 'authorizedBy', as: 'distributor' });
db.authorizations.hasMany(db.address, { foreignKey: 'userId',targetKey:'authorizedId', as: 'address' });
db.authorizations.belongsTo(db.manufacturers, { foreignKey: 'authorizedBy', as: 'manufacturer' });


db.usercarts.belongsTo(db.products, { foreignKey: 'PId', as: 'productDetails' });
db.products.hasMany(db.usercarts, { foreignKey: 'PId', as: 'cartItems' });
db.usercarts.belongsTo(db.stocks, { foreignKey: 'stockId', as: 'stockDetails' });
db.usercarts.belongsTo(db.manufacturerStocks, { foreignKey: 'stockId', as: 'stockDetailss' });
db.stocks.hasMany(db.usercarts, { foreignKey: 'stockId', as: 'cartItems' });
db.manufacturerStocks.hasMany(db.usercarts, { foreignKey: 'stockId', as: 'cartItems' });
db.orders.belongsTo(db.users, { as: "orderToUser", foreignKey: "orderTo" });
// db.orders.belongsTo(db.users, { as: "distributor", foreignKey: "orderTo" });
db.orders.belongsTo(db.users, { as: "orderFromUser", foreignKey: "orderFrom" });
db.documentCategory.hasMany(db.documents, {foreignKey:'categoryId',as: 'documnets'})
db.documents.belongsTo(db.documentCategory, {foreignKey:'categoryId',as: 'documnets'})
db.orders.belongsTo(db.distributors, {
  foreignKey: 'orderFrom', 
  as: 'distributer'
});
db.orders.hasMany(db.orderitems,{foreignKey: "orderId", as: "orderItems"})
db.orders.belongsTo(db.manufacturers,{foreignKey:'orderTo',as: 'manufacturer'})
db.orders.belongsTo(db.distributors,{foreignKey:'orderTo',as: 'distributor'})
db.orders.belongsTo(db.retailers, {foreignKey: 'orderTo', targetKey: 'retailerId', as: 'retailer'});
// db.orders.hasMany(db.authorizations, { foreignKey: "authorizedBy", targetKey: "orderTo", as: "auth" });
db.orders.belongsTo(db.authorizations, { foreignKey: "orderTo", targetKey: "authorizedBy", as: "auth" });

db.orders.belongsTo(db.manufacturers, { foreignKey: 'orderFrom', as: 'fromManufacturer' });
db.orders.belongsTo(db.distributors, { foreignKey: 'orderFrom', as: 'fromDistributor' });
db.orders.belongsTo(db.retailers, { foreignKey: 'orderFrom', as: 'fromRetailer' });


db.distributors.belongsTo(db.manufacturers,{foreignKey:'distributorId',as:"disuser"})
db.retailers.belongsTo(db.manufacturers,{foreignKey:'retailerId',as:"reuser"})
db.users.hasMany(db.distributors,{foreignKey:'distributorId',as:"disuser"})
db.users.hasMany(db.retailers,{foreignKey:'retailerId',as:"reuser"})
db.users.hasMany(db.manufacturers,{foreignKey:'manufacturerId',as:"manufacturer"})
db.users.hasMany(db.address,{foreignKey:'userId',as:"addresss"})

db.distributors.hasMany(db.orders, {
  foreignKey: 'orderFrom', 
  as: 'distributer'
});

db.orders.belongsTo(db.authorizations, {
  foreignKey: 'orderTo',
  targetKey: 'authorizedBy',
  as: 'authorization'
});



db.authorizations.belongsTo(db.distributors,{foreignKey:'authorizedId',as:"distributers"})
db.distributors.hasMany(db.authorizations,{foreignKey:'authorizedId',as:"auth"})
db.authorizations.belongsTo(db.users,{foreignKey:'authorizedId',as:"user"})
db.address.belongsTo(db.distributors,{foreignKey:'userId',targetKey:'distributorId',as:'distributorAddress'})
db.distributors.hasMany(db.address, {
  foreignKey: "userId",
  sourceKey: "distributorId",
  as: "addresses"
});
db.authorizations.belongsTo(db.users, { foreignKey: "authorizedId", as: "authorizedUser" });
db.users.hasMany(db.address,{foreignKey: "userId", as: "address"})
db.orderitems.belongsTo(db.products, { foreignKey: "PId", as: "product" });
db.orderitems.belongsTo(db.stocks, { foreignKey: "stockId", as: "stock" });
db.orderitems.belongsTo(db.manufacturerStocks, { foreignKey: "stockId", as: "stocks" });
db.orders.hasMany(db.payments,{ foreignKey: "orderId", as: "payments" })

db.manufacturers.hasMany(db.products,{ foreignKey: "manufacturerId", as: "products" })
db.manufacturers.hasMany(db.returnHeader, { 
  foreignKey: "returnTo", 
  targetKey:'manufacturerId',
  as: "returnHeader" 
});
db.products.belongsTo(db.manufacturers,{ foreignKey: "manufacturerId", as: "manufacturer" })
db.returnHeader.belongsTo(db.distributors,{foreignKey: "returnFrom", as: "returnFromUser" })
db.returnHeader.hasMany(db.returnDetails,{foreignKey: "returnId", as: "returnDetails" })
db.returnDetails.belongsTo(db.products,{foreignKey: "PId", as: "products" })
db.returnDetails.belongsTo(db.stocks,{foreignKey: "SId", as: "stocks" })
// db.returnDetails.belongsTo(db.manufacturerStocks,{foreignKey: "SId", as: "stocks" })
db.returnHeader.hasMany(db.creditNotes,{foreignKey: "returnId", as: "creditnote" })
db.returnHeader.belongsTo(db.retailers,{foreignKey: "returnFrom", as: "returnByUser" })
db.stocks.belongsTo(db.manufacturers,{foreignKey: "purchasedFrom",targetKey:'manufacturerId', as: "manufacturer" })
db.stocks.belongsTo(db.distributors,{foreignKey: "purchasedFrom",targetKey:'distributorId', as: "distributor" })
db.stocks.belongsTo(db.returnHeader,{foreignKey: "purchasedFrom",targetKey:"returnTo", as: "returnHeader" })
db.stocks.belongsTo(db.distributors,{foreignKey: "organisationId",targetKey:'distributorId', as: "distributors" })
db.retailerSalesHeader.belongsTo(db.patients,{foreignKey: "patientId", as: "patient" })
db.retailerSalesHeader.belongsTo(db.doctors,{foreignKey: "doctorId", as: "doctor" })
db.patients.hasMany(db.retailerSalesHeader,{foreignKey:"patientId",as:'retailerSalesHeaders'})
db.doctors.hasMany(db.retailerSalesHeader,{foreignKey:"doctorId",as:'retailerSalesHeaders'});
db.doctors.hasMany(db.doctorPayments,{foreignKey:"doctorId",as:'doctorPayments'})
// console.log(db.address.associations);
// console.log(db.distributors.associations);

//  sequelize.query(`
//   CREATE UNIQUE INDEX unique_stock_index 
//   ON stocks (PId, purchasedFrom, BatchNo, organisationId);
// `);


//  sequelize.queryInterface.addConstraint('documents', {
//   fields: ['categoryId', 'userId'],
//   type: 'unique',
//   name: 'unique_category_user'
// });
//  sequelize.queryInterface.addConstraint('stocks', {
//   fields: ['PId', 'BatchNo','organisationId'],
//   type: 'unique',
//   name: 'unique_category_stock'
// });

module.exports = db;