const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturerDashboard')
const {verifyToken} = require('../middlewares/auth')

router.post('/countoforders',manufacturerc.countoforders)

module.exports =router