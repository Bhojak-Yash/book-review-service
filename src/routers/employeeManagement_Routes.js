const router = require('express').Router()
const empManagement = require('../controllers/employeeManagement_Controller')
const { verifyToken } = require('../middlewares/auth')


router.post('/create_role', verifyToken, empManagement.create_role)
router.get('/get_roles', verifyToken, empManagement.get_roles)
router.put('/update_roles/:id', verifyToken, empManagement.update_roles)
router.delete('/delete_role/:id', verifyToken, empManagement.delete_role)

router.post('/module-config/create', empManagement.createModule);
router.get('/module-config/all', empManagement.getModuleHierarchy);
router.post('/create-employee', verifyToken, empManagement.create_employee);
router.post('/createModuleMappings', verifyToken, empManagement.createModuleMappings);
router.get('/getRoleModuleMappings', verifyToken, empManagement.getRoleModuleMappings);
router.get('/getAllEmployees', verifyToken, empManagement.getAllEmployees);

router.put('/employees/:id',verifyToken, empManagement.updateEmployee);



module.exports = router