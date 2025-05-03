const message = require('../helpers/message');
const PatientService = require('../services/patient');



exports.createPatient = async (req,res) => {
    try {
        // const data = {...req.body,...req.user}
        const Data = await PatientService.createPatient(req.body,req.user);
    
        // if (!distributor) {
          return res.status(Data?.status || 200).json(Data);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error createPatient:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
};

exports.checkPatient = async (req,res) => {
  try {
      // const data = {...req.query,...req.user}
      const Data = await PatientService.checkPatient(req.body,req.user);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error checkPatient:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.patients_list = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await PatientService.patients_list(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error checkPatient:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.patient_orders = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await PatientService.patient_orders(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error patient_orders:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};