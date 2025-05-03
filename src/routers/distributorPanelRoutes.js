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

module.exports =router