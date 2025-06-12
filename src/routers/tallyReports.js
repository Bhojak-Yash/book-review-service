const router = require('express').Router()
const {verifyToken} = require('../middlewares/auth')
const tallyReportsc = require('../controllers/tallyReports')

router.get('/partywise-outstanding-report',verifyToken,tallyReportsc.partywise_outstanding_report)
router.get('/partywise-payable-report',verifyToken,tallyReportsc.partywise_payable_report)
router.get('/ledger-report',verifyToken,tallyReportsc.ladger_report)

module.exports =router