const router = require('express').Router();
const expiryc = require('../controllers/expiry');
const {verifyToken} = require('../middlewares/auth');

router.get('/expire-product-list',verifyToken,expiryc.expire_product_list)
router.get('/expired-product-list',verifyToken,expiryc.expired_product_list)
router.get('/expire_details',verifyToken,expiryc.expire_details)
router.get('/expiry-details-card-data',verifyToken,expiryc.expire_details_card_data)
router.post('/raise-expiry',verifyToken,expiryc.raise_expiry)
router.get('/expiry-return-list',verifyToken,expiryc.expiry_return_list)
router.post('/update-expiry-return',verifyToken,expiryc.update_expiry_return)
router.get('/returned-details',verifyToken,expiryc.returned_details)
router.get('/expiry-list-card-data',verifyToken,expiryc.expiry_list_card_data)
router.get('/get-credit-notes',verifyToken,expiryc.get_credit_notes)
router.get('/redeem-cn',verifyToken,expiryc.redeem_cn)
router.get('/returned-list',verifyToken,expiryc.returned_list)
router.get('/cn-requests-page-card-data',verifyToken,expiryc.cn_request_page_card_data)

module.exports =router