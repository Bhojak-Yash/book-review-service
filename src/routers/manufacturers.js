const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturers')
const {verifyToken} = require('../middlewares/auth')

router.post('/createManufacturer',manufacturerc.createManufacturer)
router.post('/updateManufacturer',verifyToken,manufacturerc.updateManufacturer)
router.post('/getManufacturer',verifyToken,manufacturerc.getManufacturer)
router.get('/manufacturer-prchaseOrders',verifyToken,manufacturerc.prchaseOrders)
router.get('/cnf-details',verifyToken,manufacturerc.cnf_details)
router.get('/distributers-cnf-summary',verifyToken,manufacturerc.distributers_cnf_summary)
router.get('/po-page-card-data',verifyToken,manufacturerc.po_page_card_data)

module.exports =router