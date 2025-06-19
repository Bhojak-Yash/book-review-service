const hospitalService = require('../services/hospital_Service');

// exports.create_Hospital = async (req, res) => {
//     try {
//         const result = await hospitalService.create_Hospital(req.body);
//         res.status(result?.status || 200).json(result);
//     } catch (error) {
//         console.error("Error in create_Hospital controller:", error);
//         res.status(500).json({
//             message: 'Failed to create hospital',
//             error: error.message
//         });
//     }
// };

exports.get_Hospital = async (req, res) => {
    try {
        const result = await hospitalService.get_Hospital(req.query);
        res.status(result?.status || 200).json(result);
    } catch (error) {
        console.error("Error in get_Hospital controller:", error);
        res.status(500).json({
            message: 'Failed to get the Hospital',
            error: error.message
        });
    }
};

exports.update_Hospital = async (req, res) => {
    try {
        const { hospitalId } = req.query;
        const updateData = req.body;

        const result = await hospitalService.update_Hospital(hospitalId, updateData);
        return res.status(result?.status || 200).json(result);
    } catch (error) {
        console.error("Error in update_Hospital controller:", error);
        return res.status(500).json({
            status: 500,
            message: 'Failed to update hospital',
            error: error.message
        });
    }
};

exports.get_HospitalById = async (req, res) => {
    try {
        const result = await hospitalService.get_HospitalById(req.query);
        res.status(result.status || 200).json(result);
    } catch (error) {
        console.error("Error in get_HospitalById controller:", error);
        res.status(500).json({
            message: 'Failed to get the hospital by ID',
            error: error.message
        });
    }
};

exports.getHospitalProfile = async (req, res) => {
    try {
        const result = await hospitalService.getHospitalProfile(req?.user);
        res.status(result.status || 200).json(result);
    } catch (error) {
        console.error("Error in getHospitalProfile controller:", error);
        res.status(500).json({
            message: 'Failed to get the hospital by ID',
            error: error.message
        });
    }
};
