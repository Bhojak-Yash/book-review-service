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
const statesRouter = require('./statesRoutes')
const notificationsRouter = require('./notificationsRoutes')
const expiryRouter = require('./expiry')
const employeeManagement_Router = require('./employeeManagement_Routes')
const warehouseManagement_Router = require('./warehouseManagement_Routes')
const accountsRouter = require('./accountsRoutes')




module.exports ={usersRouter,dashboardRouter,orderRouter,pharmacyRouter,inquiryRouter,productRouter,manufacturerRouter,expiryRouter,retailerRouter,distributorRouter,stockRouter,usercartRouter,entityRouter,rolesRouter,empolyeeRouter,authRouter,manufacturerDashboard, distributorPanelRouter, statesRouter, notificationsRouter, employeeManagement_Router, warehouseManagement_Router, accountsRouter}