const router = require('express').Router()
const doctors = require('../controllers/doctors')
const {verifyToken} = require('../middlewares/auth')

router.get('/createDoctor',verifyToken,doctors.createDoctor)

module.exports =router