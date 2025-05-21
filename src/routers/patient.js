const router = require('express').Router()
const patientc = require('../controllers/patient')
const {verifyToken} = require('../middlewares/auth')

router.post('/createPatient',verifyToken,patientc.createPatient)
router.post('/checkPatient',verifyToken,patientc.checkPatient)
router.get('/patients-list',verifyToken,patientc.patients_list)
router.get('/patient-orders',verifyToken,patientc.patient_orders)
router.get('/patient-delete',verifyToken,patientc.patient_delete)
router.post('/patient-update',verifyToken,patientc.patient_update)

module.exports =router