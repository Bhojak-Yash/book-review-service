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
const usercartRouter = require('./usercarts')
const entityRouter = require('./entities')
const rolesRouter = require('./roles')
const empolyeeRouter = require('./employee')
const authRouter = require('./authorization')
const manufacturerDashboard = require('./manufacturerDashboard')
const distributorPanelRouter = require('./distributorPanelRoutes')




module.exports ={usersRouter,dashboardRouter,orderRouter,pharmacyRouter,inquiryRouter,productRouter,manufacturerRouter,
    retailerRouter,distributorRouter,stockRouter,usercartRouter,entityRouter,rolesRouter,empolyeeRouter,authRouter,manufacturerDashboard, distributorPanelRouter}