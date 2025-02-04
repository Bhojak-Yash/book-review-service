const router = require('express').Router()
const stocksc = require('../controllers/stocks')
const {verifyToken} = require('../middlewares/auth')

//console.log(stocksc);
router.get('/get-StockDetails-products/:PId',verifyToken,stocksc.getStockDetails)
router.get('/get-manufacturer-stocks',verifyToken,stocksc.getStockDetailsByManufacturer)
router.post('/add-stock',verifyToken,stocksc.addStock)
router.post('/update-stock',verifyToken,stocksc.updateStock)
router.get('/get-manufacturer-StockSummary',verifyToken,stocksc.getManufacturerStockSummary)
// router.get('/get-stocks')

module.exports =router