const router = require('express').Router();
const expiryc = require('../controllers/expiry');
const {verifyToken} = require('../middlewares/auth');

router.get('/expire-product-list',verifyToken,expiryc.expire_product_list)
router.get('/expiry-page-card-data',verifyToken,expiryc.expiry_page_card_data)

module.exports =router