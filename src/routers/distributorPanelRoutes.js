const router = require('express').Router()
const distributorPanelController = require('../controllers/distributorPanelController')
const {verifyToken} = require('../middlewares/auth')

router.get('/distProductInfo', verifyToken, distributorPanelController.distProductInfo)
router.get('/distributorRequest', verifyToken, distributorPanelController.distributorRequest)
router.get('/stockRunningLow', verifyToken, distributorPanelController.stockRunningLow)
router.get('/topProducts', verifyToken, distributorPanelController.topProducts)
router.get('/topRetailers', verifyToken, distributorPanelController.topRetailers)
router.get('/topDistributors', verifyToken, distributorPanelController.topDistributors)

router.get('/distributor-request-test', verifyToken, distributorPanelController.distributorRequest)// test 
router.get('/stock-runningLow-test', verifyToken, distributorPanelController.stockRunningLow)// test

//KPIs.......
router.get('/top-products-today',verifyToken, distributorPanelController.topProductsToday);
router.get('/get-payment-stats', verifyToken, distributorPanelController.getPaymentRelatedStats);
router.get('/get-slow-moving-items', verifyToken, distributorPanelController.getSlowMovingMedicines);
router.get('/get-patients-doctors', verifyToken, distributorPanelController.getPatientsAndDoctors);

router.get('/get-topPatients', verifyToken, distributorPanelController.getTopPatients);


module.exports =router