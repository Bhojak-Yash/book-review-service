const router = require('express').Router()
const employeec = require('../controllers/employees')
const {verifyToken} = require('../middlewares/auth')

router.post('/createEmployee',verifyToken,employeec.createEmployee)

module.exports =router