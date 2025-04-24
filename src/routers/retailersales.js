const router = require('express').Router()
const retailersalesc = require('../controllers/retailersales')
const {verifyToken} = require('../middlewares/auth')

router.get('/searchMedicine',verifyToken,retailersalesc.searchMedicine)

module.exports =router