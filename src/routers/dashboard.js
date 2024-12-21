const router = require('express').Router()
const dashboardc = require('../controllers/dashboard')
const {verifyToken} = require('../middlewares/auth')

router.post('/dashboard-details',verifyToken,dashboardc.dashboard_details)
router.post('/dashboard_graph',verifyToken,dashboardc.dashboard_graph)
router.post('/sales_overview',verifyToken,dashboardc.sales_overview)

module.exports =router