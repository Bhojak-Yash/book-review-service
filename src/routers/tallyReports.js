const router = require('express').Router()
const {verifyToken} = require('../middlewares/auth')
const tallyReportsc = require('../controllers/tallyReports')

router.get('/partwise-outstanding-report',tallyReportsc.partwise_outstanding_report)

module.exports =router