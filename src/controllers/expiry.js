const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const expiryService = require('../services/expiry');


exports.expire_product_list = async (req, res) => {
    try {
        const data ={...req.query,...req.user}
        const expiry = await expiryService.expire_product_list(data);
    
        // if (!distributor) {
          return res.json(expiry);
        // }
    
        // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
      } catch (error) {
        console.error("Error fetching expire_product_list:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
}

exports.expiry_page_card_data = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.expiry_page_card_data(data);
  
      // if (!distributor) {
        return res.json(expiry);
      // }
  
      // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
    } catch (error) {
      console.error("Error fetching expiry_page_card_data:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}