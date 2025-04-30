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
router.get('/po-page-card-data-retailer',verifyToken,retailerc.po_page_card_data_retailer)
router.get('/retailers-stock-cards-data',verifyToken,retailerc.retailers_stock_card_data)
router.post('/retailer-medicine-add',verifyToken,retailerc.retailer_medicine_add)

module.exports =router