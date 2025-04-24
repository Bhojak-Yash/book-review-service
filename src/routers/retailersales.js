const router = require('express').Router()
const retailersalesc = require('../controllers/retailersales')
const {verifyToken} = require('../middlewares/auth')

router.get('/searchMedicine',verifyToken,retailersalesc.searchMedicine)
router.post('/create-sales-order',verifyToken,retailersalesc.create_sales_order)

module.exports =router