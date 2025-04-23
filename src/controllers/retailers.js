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
          return res.status(Retailer?.status || 200).json({ status:Retailer.status,message:Retailer.message, });
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
      return res.status(distributors?.status || 200).json(distributors);
  } catch (error) {
    console.log('get_distributors_list error:',error.message)
    res.status(500).json({
      status:message.code500,
      message:message.message500,
    })
  }
}

// exports.get_distributors_list = async (req, res) => {
//   try {
//     console.log("Decoded User from Token:", req.user); // Debugging userId
//     const data = {...req.query,...req.user}
//     const response = await RetailerService.get_distributors_list(data);

//     return res.status(response.status).json(response);
//   } catch (error) {
//     console.error("get_distributors_list Error:", error.message);
//     return res.status(500).json({ status: 500, message: "Internal Server Error" });
//   }
// };

exports.get_search_by_product = async (req,res) => {
  try {
    const data = {...req.query}
    const get_search_by_product = await RetailerService.get_search_by_product(data);
    
    // if (!distributor) {
      return res.status(get_search_by_product?.status || 200).json(get_search_by_product);
  } catch (error) {
    console.log('get_search_by_product error:',error.message)
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
    const data = {...req.body,...req.user}
    const response = await RetailerService.retailer_profile_update(data);

    return res.status(response?.status || 200).json(response);
  } catch (error) {
    console.error("Retailer Profile Update Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

exports.retailer_profile_get = async (req, res) => {
  try {
    // console.log("Decoded User from Token:", req.user); // Debugging userId
    const data = {...req.user}
    const response = await RetailerService.retailer_profile_get(data);

    return res.status(response?.status || 200).json(response);
  } catch (error) {
    console.error("retailer_profile_get Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};
exports.get_stocks_byDistributor = async (req, res) => {
  try {
    // console.log("Decoded User from Token:", req.user); // Debugging userId
    const data = {...req.user,...req.query}
    const response = await RetailerService.get_stocks_byDistributor(data);

    return res.status(response?.status || 200).json(response);
  } catch (error) {
    console.error("get_stocks_byDistributor Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

exports.get_retailer_po_list = async (req, res) => {
  try {
    // console.log("Decoded User from Token:", req.user); // Debugging userId
    const data = {...req.user,...req.query}
    const response = await RetailerService.get_retailer_po_list(data);

    return res.status(response?.status || 200).json(response);
  } catch (error) {
    console.error("get_retailer_po_list Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

exports.po_page_card_data_retailer = async (req, res) => {
  try {
    // console.log("Decoded User from Token:", req.user); // Debugging userId
    const data = {...req.user,...req.query}
    const response = await RetailerService.po_page_card_data_retailer(data);

    return res.status(response?.status || 200).json(response);
  } catch (error) {
    console.error("po_page_card_data_retailer Error:", error.message);
    return res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};