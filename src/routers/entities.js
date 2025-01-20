const router = require('express').Router()
const entitiesc = require('../controllers/entities')
const {verifyToken} = require('../middlewares/auth')


router.post('/add-entity',verifyToken,entitiesc.addEntity)
router.post('/update-entity',verifyToken,entitiesc.updateEntity)
router.get('/get-entities',verifyToken,entitiesc.getEntities)

module.exports =router