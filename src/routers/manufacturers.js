const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturers')
const {verifyToken} = require('../middlewares/auth')

router.post('/createManufacturer',verifyToken,manufacturerc.createManufacturer)
router.post('/updateManufacturer',verifyToken,manufacturerc.updateManufacturer)
router.post('/getManufacturer',verifyToken,manufacturerc.getManufacturer)
router.get('/manufacturer-prchaseOrders',verifyToken,manufacturerc.prchaseOrders)

module.exports =router