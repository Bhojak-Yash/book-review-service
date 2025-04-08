const router = require('express').Router()
const warehouseController = require('../controllers/warehouseManagement_Controller')
const { verifyToken } = require('../middlewares/auth')


router.post('/create-warehouse', verifyToken, warehouseController.createWarehouse);
router.get('/getAllWarehouses', verifyToken, warehouseController.getAllWarehouses);
router.put("/updateWarehouse/:entityId", verifyToken, warehouseController.updateWarehouseController);
router.delete('/warehouse/:entityId', verifyToken, warehouseController.deleteWarehouse);
router.get("/bulkUpdateWarehouseStatus", verifyToken, warehouseController.bulkUpdate);
router.get("/getWarehouseStats", verifyToken, warehouseController.getWarehouseStats);

module.exports = router;