const usersRouter = require('./users')
const dashboardRouter = require('./dashboard')
const orderRouter = require('./orders')
const pharmacyRouter = require('./retailers')
const inquiryRouter = require('./inquiry')
const productRouter = require('./products')
const stockRouter = require('./stocks')
const manufacturerRouter = require('./manufacturers')
const retailerRouter = require('./retailers')
const distributorRouter = require('./distributors')




module.exports ={usersRouter,dashboardRouter,orderRouter,pharmacyRouter,inquiryRouter,productRouter,manufacturerRouter,
    retailerRouter,distributorRouter,stockRouter}