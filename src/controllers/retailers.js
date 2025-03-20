// const db = require('../models/users')
const message = require('../helpers/message')
const { generateToken } = require('../middlewares/auth')
const db = require('../models/db')
const bcrypt = require('bcrypt');
// const Users = db.users;
const Sequelize = db.sequelize;
// const Op = db.Op;
// const Pharmacy = db.retailers;
// const Retailers = db.retailers;
const RetailerService = require('../services/retailerService');

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}



exports.createRetailer = async (req,res) => {
    try {
        const data = req.body
        const Retailer = await RetailerService.createRetailers(data);
    
        // if (!distributor) {
          return res.json({ status:Retailer.status,message:Retailer.message, });
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching createRetailer:", error);
        return res.status(500).json({ status:message.code500,message: "Failed to create retailers", error: error.message });
      }
};

exports.get_distributors_list = async (req,res) => {
  try {
    const data = {...req.query}
    const distributors = await RetailerService.get_distributors_list(data);
    
    // if (!distributor) {
      return res.json(distributors);
  } catch (error) {
    console.log('get_distributors_list error:',error.message)
    res.status(500).json({
      status:message.code500,
      message:message.message500,
    })
  }
}

// exports.retailer_profile_update = async (req, res) => {
//   try {
//     const data = { ...req.user, ...req.body }
//     const distributor = await RetailerService.retailer_profile_update(data);

//     return res.json(distributor);
//   } catch (error) {
//     console.error("retailer_profile_update Error:", error.message);
//     return res.status(500).json({ status: message.code500, message: error.message });
//   }
// }

exports.retailer_profile_update = async (req, res) => {
  try {
    console.log("Decoded User from Token:", req.user); // Debugging userId

    const response = await RetailerService.retailer_profile_update(req);

    return res.status(response.status).json(response);
  } catch (error) {
    console.error("Retailer Profile Update Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};
