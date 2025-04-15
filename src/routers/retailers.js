const router = require('express').Router()
const retailerc = require('../controllers/retailers')
const {verifyToken} = require('../middlewares/auth')


router.post('/createRetailer',retailerc.createRetailer)
router.get('/get-distributor-list',retailerc.get_distributors_list)
router.put('/retailer-profile-update', verifyToken, retailerc.retailer_profile_update)
router.get('/get-search-by-product',retailerc.get_search_by_product)
router.get('/retailer-profile-get',verifyToken,retailerc.retailer_profile_get)
router.get('/get-distributors-list',verifyToken,retailerc.get_distributors_list)
router.get('/get-stocks-byDistributor',retailerc.get_stocks_byDistributor)
router.get('/get-retailer-po-list',verifyToken,retailerc.get_retailer_po_list)

module.exports =router