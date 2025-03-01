const router = require('express').Router()
const ordersc = require('../controllers/orders')
const {verifyToken} = require('../middlewares/auth')

// router.post('/getorders',verifyToken,ordersc.getorders)
// router.get('/getOrderDetails',verifyToken,ordersc.getOrderDetails)
router.post('/createOrder',verifyToken,ordersc.createOrder)
router.put('/updateOrder/:id',verifyToken,ordersc.updateOrder)
// router.post('/updateOrder',verifyToken,ordersc.updateOrder)
router.get('/getOrder/filters',verifyToken,ordersc.getOrdersByFilters)
router.get('/getOrderBytype',verifyToken,ordersc.getOrdersByType)
router.get('/distributer-purchase-order',verifyToken,ordersc.distributer_purchase_orders)
router.get('/distributer-sales-order',verifyToken,ordersc.distributer_sales_orders)
router.get('/purchase-order-summary',verifyToken,ordersc.purchase_order_summary)
router.get('/confirm-payment',verifyToken,ordersc.confirm_payment)

module.exports =router