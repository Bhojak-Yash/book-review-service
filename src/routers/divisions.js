const router = require('express').Router()
const divisionsc = require('../controllers/divisions')
const {verifyToken} = require('../middlewares/auth')


router.post('/add-division',verifyToken,divisionsc.addDivision)
router.post('/update-division',verifyToken,divisionsc.updateDivision)

module.exports =router