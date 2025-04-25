const router = require('express').Router()
const doctors = require('../controllers/doctors')
const {verifyToken} = require('../middlewares/auth')

router.post('/createDoctor',verifyToken,doctors.createDoctor)
router.post('/checkdoctor',verifyToken,doctors.checkdoctor)
router.get('/doctors-list',verifyToken,doctors.doctors_list)

module.exports =router