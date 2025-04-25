const router = require('express').Router()
const patientc = require('../controllers/patient')
const {verifyToken} = require('../middlewares/auth')

router.post('/createPatient',verifyToken,patientc.createPatient)
router.post('/checkPatient',verifyToken,patientc.checkPatient)
router.get('/patients-list',verifyToken,patientc.patients_list)

module.exports =router