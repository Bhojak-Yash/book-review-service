const router = require('express').Router()
const retailerc = require('../controllers/retailers')
const {verifyToken} = require('../middlewares/auth')


router.post('/createRetailer',retailerc.createRetailer)
// router.get('/getPharmacies',verifyToken,pharmacyc.getPharmacies)
// router.get('/pharmacyDetails',verifyToken,pharmacyc.pharmacyDetails)
// router.post('/pharmacy-sales',verifyToken,pharmacyc.pharmacy_sales)
// router.post('/oneDay_sales',verifyToken,pharmacyc.oneDay_sales)


module.exports =router