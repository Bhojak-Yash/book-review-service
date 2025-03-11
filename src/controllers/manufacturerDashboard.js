// const db = require('../models/users')
const message = require('../helpers/message')
const ManufacturerDash = require('../services/manufacturerDashService');



exports.countoforders = async (req, res) => {
    try {
      const data = {...req.query,...req.user};
      const result = await ManufacturerDash.countoforders(data);
  
        return res.json(result);
     
    } catch (error) {
      console.error("Error countoforders:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
  };