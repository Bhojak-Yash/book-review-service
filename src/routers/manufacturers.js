const router = require('express').Router()
const manufacturerc = require('../controllers/manufacturers')
const {verifyToken} = require('../middlewares/auth')

router.post('/updateManufacturer',verifyToken,manufacturerc.updateManufacturer)


module.exports =router