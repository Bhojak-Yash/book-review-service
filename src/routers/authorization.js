const router = require('express').Router()
const authorization = require('../controllers/authorization')
const {verifyToken} = require('../middlewares/auth')

router.post('/distributer-auth-request',verifyToken,authorization.distributer_auth_request)


module.exports =router