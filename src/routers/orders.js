const router = require('express').Router()
const ordersc = require('../controllers/orders')
const {verifyToken} = require('../middlewares/auth')

router.post('/getorders',verifyToken,ordersc.getorders)
router.get('/getOrderDetails',verifyToken,ordersc.getOrderDetails)
router.post('/routeInfo',ordersc.routeInfo)

module.exports =router