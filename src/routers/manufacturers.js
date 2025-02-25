const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturers')
const {verifyToken} = require('../middlewares/auth')

router.post('/createManufacturer',manufacturerc.createManufacturer)
router.post('/updateManufacturer',verifyToken,manufacturerc.updateManufacturer)
router.post('/getManufacturer',verifyToken,manufacturerc.getManufacturer)
router.get('/manufacturer-prchaseOrders',verifyToken,manufacturerc.prchaseOrders)
router.get('/cnf-details',verifyToken,manufacturerc.cnf_details)

module.exports =router