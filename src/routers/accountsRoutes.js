const router = require('express').Router()
const accountsController = require('../controllers/accountsController')
const { verifyToken } = require('../middlewares/auth')

//Payable accounts
router.get('/orders', verifyToken, accountsController.getOrders);
router.get('/total-balance', verifyToken, accountsController.getTotalDueBalance);
router.get('/overdue-balance/:orderTo', verifyToken, accountsController.getOverdueBalance);


//Receivable accounts
router.get('/orders-received', verifyToken, accountsController.getOrdersReceived);
router.get('/due-balance/grouped', verifyToken, accountsController.getTotalDueBalanceGroupedByOrderFrom);
router.get('/overdue-balances/:orderFrom', verifyToken, accountsController.getOverdueBalanceForUser);


module.exports = router;