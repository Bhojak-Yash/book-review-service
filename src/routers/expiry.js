const router = require('express').Router();
const expiryc = require('../controllers/expiry');
const {verifyToken} = require('../middlewares/auth');

router.get('/expire-product-list',verifyToken,expiryc.expire_product_list)
router.get('/expire_details',verifyToken,expiryc.expire_details)
router.get('/expiry-details-card-data',verifyToken,expiryc.expire_details_card_data)
router.post('/raise-expiry',verifyToken,expiryc.raise_expiry)
router.get('/expiry-return-list',verifyToken,expiryc.expiry_return_list)
router.post('/update-expiry-return',verifyToken,expiryc.update_expiry_return)
router.get('/returned-details',verifyToken,expiryc.returned_details)
router.get('/expiry-list-card-data',verifyToken,expiryc.expiry_list_card_data)

module.exports =router