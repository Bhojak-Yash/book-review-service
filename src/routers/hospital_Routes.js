const express = require('express');
const hospitalController = require('../controllers/hospital_Controller');
const { verifyToken } = require('../middlewares/auth');

const router = express.Router();

// router.post('/create-hospital', hospitalController.create_Hospital);
router.get('/get-hospitals', verifyToken, hospitalController.get_Hospital);
router.put('/update-hospital', verifyToken, hospitalController.update_Hospital);
router.get('/get-hospitalById', verifyToken, hospitalController.get_HospitalById);
router.get("/getHospitalProfile", verifyToken, hospitalController.getHospitalProfile);

module.exports = router;