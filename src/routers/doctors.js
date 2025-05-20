const router = require('express').Router()
const doctors = require('../controllers/doctors')
const {verifyToken} = require('../middlewares/auth')

router.post('/createDoctor',verifyToken,doctors.createDoctor)
router.post('/checkdoctor',verifyToken,doctors.checkdoctor)
router.get('/doctors-list',verifyToken,doctors.doctors_list)
router.get('/doctor-details',verifyToken,doctors.doctor_details)
router.get('/doctor-delete',verifyToken,doctors.doctor_delete)

module.exports =router