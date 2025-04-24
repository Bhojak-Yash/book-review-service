const router = require('express').Router()
const patientc = require('../controllers/patient')
const {verifyToken} = require('../middlewares/auth')

router.get('/createPatient',verifyToken,patientc.createPatient)

module.exports =router