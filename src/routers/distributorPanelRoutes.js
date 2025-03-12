const router = require('express').Router()
const distributorPanelController = require('../controllers/distributorPanelController')
const {verifyToken} = require('../middlewares/auth')

router.get('/statistics_one', verifyToken, distributorPanelController.getStatistics_one)
router.get('/statistics_two', verifyToken, distributorPanelController.getStatistics_two)
router.get('/statistics_three', verifyToken, distributorPanelController.Statistics_three)
router.get('/Statistics_four', verifyToken, distributorPanelController.Statistics_four)
router.get('/Statistics_five', verifyToken, distributorPanelController.Statistics_five)

module.exports =router