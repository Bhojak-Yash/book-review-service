const router = require('express').Router()
const salesReportc = require('../controllers/salesReport')
const {verifyToken} = require('../middlewares/auth')

router.get('/sales-report',salesReportc.sales_report);
router.get('/get-operational-Metrics', verifyToken, salesReportc.operationalMetrics);


module.exports =router