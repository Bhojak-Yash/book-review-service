const router = require('express').Router()
const authorization = require('../controllers/authorization')
const {verifyToken} = require('../middlewares/auth')

router.post('/distributer-auth-request',verifyToken,authorization.distributer_auth_request)
router.get('/auth-request-list',verifyToken,authorization.auth_request_list)
router.get('/auth-distributer-summary',verifyToken,authorization.auth_distributer_summary)
router.get('/auth-page-card-data-distributor',verifyToken,authorization.auth_page_card_data_distributor)
router.post('/stop-po',verifyToken,authorization.stop_po)
router.get('/update-auth-request',verifyToken,authorization.update_auth_request)
router.get('/authorizedBy-users',authorization.authorizedBy_users)
router.get('/distributor-auth-request-list',verifyToken,authorization.distributor_auth_request_list)

module.exports =router