const router = require('express').Router();
const expiryc = require('../controllers/expiry');
const {verifyToken} = require('../middlewares/auth');

router.get('/expire-product-list',verifyToken,expiryc.expire_product_list)
router.get('/expiry-page-card-data',)

module.exports =router