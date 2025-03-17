const router = require('express').Router()
const statesController = require('../controllers/statesController')
const {verifyToken} = require('../middlewares/auth')

router.get('/getStatesAndCities', verifyToken, statesController.getStatesAndCities)

module.exports =router