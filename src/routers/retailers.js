const router = require('express').Router()
const retailerc = require('../controllers/retailers')
const {verifyToken} = require('../middlewares/auth')


router.post('/createRetailer',retailerc.createRetailer)
router.get('/get-distributor-list',retailerc.get_distributors_list)
router.put('/retailer_profile_update', verifyToken, retailerc.retailer_profile_update)

module.exports =router