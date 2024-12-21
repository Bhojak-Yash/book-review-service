const router = require('express').Router()
const distributorsc = require('../controllers/distributors')
const {verifyToken} = require('../middlewares/auth')

//router.post('/create-distributor',verifyToken,distributorsc.createDistributor)
//router.post('/update-distributor',verifyToken,distributorsc.updateDistributor)


module.exports =router