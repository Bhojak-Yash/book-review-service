const router = require('express').Router()
const distributorsc = require('../controllers/distributors')
const {verifyToken} = require('../middlewares/auth')

//router.post('/create-distributor',verifyToken,distributorsc.createDistributor)
//router.post('/update-distributor',verifyToken,distributorsc.updateDistributor)
router.post('/createDistributor',verifyToken,distributorsc.createDistributor)
router.get('/get-manufacturers',verifyToken,distributorsc.getManufacturer)
router.get('/get-stocksByManufacturer',verifyToken,distributorsc.getStocksByManufacturer)

module.exports =router