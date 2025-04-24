const message = require('../helpers/message');
const PatientService = require('../services/patient');



exports.createPatient = async (req,res) => {
    try {
        const data = {...req.query,...req.user}
        const Data = await PatientService.createPatient(data);
    
        // if (!distributor) {
          return res.status(Data?.status || 200).json(Data);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error createPatient:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
};