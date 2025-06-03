const router = require('express').Router()
const salesc = require('../controllers/sales')
const {verifyToken} = require('../middlewares/auth')

//console.log(stocksc);
router.get('/search-product',verifyToken,salesc.search_product)
router.post('/create-party',verifyToken,salesc.create_party)
router.post('/check-party',verifyToken,salesc.check_party)
router.get('/get-party-list',verifyToken,salesc.get_party_list)
router.post('/create-sales',verifyToken,salesc.create_sales)
router.get('/get-sales',verifyToken,salesc.get_sales)
router.get('/sales-details',verifyToken,salesc.sales_details)


module.exports =router