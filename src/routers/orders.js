const router = require('express').Router()
const ordersc = require('../controllers/orders')
const {verifyToken} = require('../middlewares/auth')

// router.post('/getorders',verifyToken,ordersc.getorders)
// router.get('/getOrderDetails',verifyToken,ordersc.getOrderDetails)
router.post('/createOrder',verifyToken,ordersc.createOrder)
router.put('/updateOrder/:id',verifyToken,ordersc.updateOrder)
router.get('/getOrder/filters',verifyToken,ordersc.getOrdersByFilters)
router.get('/getOrderBytype',verifyToken,ordersc.getOrdersByType)

module.exports =router