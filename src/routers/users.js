const router = require('express').Router()
const usersc = require('../controllers/users')
const {verifyToken} = require('../middlewares/auth')

router.post('/create-users',usersc.createUsers)
router.post('/login',usersc.login)
router.post('/change-password',verifyToken,usersc.changePassword)
router.post('/logout',verifyToken,usersc.logout)
router.post('/forgot-password',usersc.forgotPassword)

module.exports =router