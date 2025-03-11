const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturerDashboard')
const {verifyToken} = require('../middlewares/auth')

router.get('/countoforders',verifyToken,manufacturerc.countoforders)

module.exports =router