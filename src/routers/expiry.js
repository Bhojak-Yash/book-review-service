const router = require('express').Router();
const expiryc = require('../controllers/expiry');
const {verifyToken} = require('../middlewares/auth');

router.get('/expire-product-list',expiryc.expire_product_list)

module.exports =router