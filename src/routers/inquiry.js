const router = require('express').Router()
const inquiryc = require('../controllers/inquiry')

router.post('/inquiry',inquiryc.inquiry)

module.exports =router