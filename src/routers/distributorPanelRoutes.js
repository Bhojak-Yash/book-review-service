const router = require('express').Router()
// const distributorPanelController = require('../controllers/distributorPanelController')
const {verifyToken} = require('../middlewares/auth')

// router.get('/Stats_1', verifyToken, distributorPanelController.countoforders)

module.exports =router
