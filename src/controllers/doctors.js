const message = require('../helpers/message');
const DoctorsService = require('../services/doctors');



exports.createDoctor = async (req,res) => {
    try {
        // const data = {...req.query,...req.user}
        const Data = await DoctorsService.createDoctor(req.body,req.user);
    
        // if (!distributor) {
          return res.status(Data?.status || 200).json(Data);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error createDoctor:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
};

exports.checkdoctor = async (req,res) => {
  try {
      // const data = {...req.query,...req.user}
      const Data = await DoctorsService.checkdoctor(req.body,req.user);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error checkdoctor:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.doctors_list = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await DoctorsService.doctors_list(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error doctors_list:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.doctor_details = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await DoctorsService.doctor_details(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error doctor_details:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};

exports.doctor_delete = async (req,res) => {
  try {
      const data = {...req.query,...req.user}
      const Data = await DoctorsService.doctor_delete(data);
  
      // if (!distributor) {
        return res.status(Data?.status || 200).json(Data);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error doctor_delete:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
};