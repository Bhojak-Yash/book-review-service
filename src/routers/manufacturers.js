const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturers')
const {verifyToken} = require('../middlewares/auth')

router.post('/createManufacturer',verifyToken,manufacturerc.createManufacturer)
router.post('/updateManufacturer',verifyToken,manufacturerc.updateManufacturer)
router.post('/getManufacturer',manufacturerc.getManufacturer)


module.exports =router