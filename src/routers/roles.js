const router = require('express').Router()
const rolesc = require('../controllers/roles')
const {verifyToken} = require('../middlewares/auth')

//console.log(stocksc);
router.get('/get-roles/:ownerId',verifyToken,rolesc.getRoles)


module.exports =router