const router = require('express').Router()
const retailersalesc = require('../controllers/retailersales')
const {verifyToken} = require('../middlewares/auth')

router.get('/searchMedicine',verifyToken,retailersalesc.searchMedicine)
router.post('/create-sales-order',verifyToken,retailersalesc.create_sales_order)
router.get('/retailer-sales-orders',verifyToken,retailersalesc.retailer_sales_orders)
router.post('/make-doctors-payment',verifyToken,retailersalesc.make_doctors_payment)
router.get('/delete-order',verifyToken,retailersalesc.delete_order)
router.post('/update-sales-order',verifyToken,retailersalesc.update_sales_order)

router.get('/get-retailerSales-cardData', verifyToken, retailersalesc.get_retailerSales_cardData);

module.exports =router