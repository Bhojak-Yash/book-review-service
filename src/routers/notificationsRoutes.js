const router = require('express').Router()
const notificationsController = require('../controllers/notificationsController')
const {verifyToken} = require('../middlewares/auth')

router.get('/notifications/:organisationId', notificationsController.getNotifications); 
router.put('/markAsRead/:notificationId', notificationsController.markAsRead);

module.exports =router