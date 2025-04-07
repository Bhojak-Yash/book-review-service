const router = require('express').Router()
const distributorsc = require('../controllers/distributors')
const {verifyToken} = require('../middlewares/auth')

//router.post('/create-distributor',verifyToken,distributorsc.createDistributor)
//router.post('/update-distributor',verifyToken,distributorsc.updateDistributor)
router.post('/createDistributor',distributorsc.createDistributor)
router.get('/get-manufacturers',distributorsc.getManufacturer)
router.get('/get-stocksByManufacturer',distributorsc.getStocksByManufacturer)
router.get('/po-page-data',verifyToken,distributorsc.po_page_data)
router.get('/so-page-data',verifyToken,distributorsc.so_page_data)
router.get('/distributor-profile',verifyToken,distributorsc.distributor_profile)
router.post('/update-distributor',verifyToken,distributorsc.update_distributor)
router.get('/check-profile',verifyToken,distributorsc.check_profile)
router.get('/get-distributor-stocks',verifyToken,distributorsc.get_distributor_stocks)
router.post('/update-distributorType',verifyToken,distributorsc.update_distributorType)


module.exports =router