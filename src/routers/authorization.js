const router = require('express').Router()
const authorization = require('../controllers/authorization')
const {verifyToken} = require('../middlewares/auth')

router.post('/distributer-auth-request',verifyToken,authorization.distributer_auth_request)
router.get('/auth-request-list',verifyToken,authorization.auth_request_list)
router.get('/auth-distributer-summary',verifyToken,authorization.auth_distributer_summary)
router.post('/stop-po',verifyToken,authorization.stop_po)

module.exports =router