const router = require('express').Router()
const usercartsc = require('../controllers/usercarts')
const {verifyToken} = require('../middlewares/auth')


router.post('/addToCart',verifyToken,usercartsc.addToCart)
router.post('/discardCart',verifyToken,usercartsc.discardCart)
router.post('/deleteCartItem/:cartItemId',verifyToken,usercartsc.deleteCartItem)
router.get('/getUserCart',verifyToken,usercartsc.getUserCart)

module.exports =router