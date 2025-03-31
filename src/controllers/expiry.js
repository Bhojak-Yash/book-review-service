const db = require('../models/db')
const sequelize = db.sequelize
const message = require('../helpers/message')
const expiryService = require('../services/expiry');


exports.expire_product_list = async (req, res) => {
    try {
        const data ={...req.query,...req.user}
        const expiry = await expiryService.expire_product_list(data);
    
          return res.json(expiry);
        
        } catch (error) {
        console.error("Error fetching expire_product_list:", error);
        return res.status(500).json({ status:message.code500,message:error.message });
      }
}

exports.expire_details = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.expire_details(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching expire_details:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.expire_details_card_data = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.expire_details_card_data(data);
  
        return res.json(expiry);
     
      } catch (error) {
      console.error("Error fetching expire_details_card_data:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.raise_expiry = async (req, res) => {
  try {
      const data ={...req.body,...req.user}
      const expiry = await expiryService.raise_expiry(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching raise_expiry:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.expiry_return_list = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.expiry_return_list(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching expiry_return_list:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.update_expiry_return = async (req, res) => {
  try {
      const data ={...req.body,...req.user}
      const expiry = await expiryService.update_expiry_return(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching update_expiry_return:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.returned_details = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.returned_details(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching returned_details:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.expiry_list_card_data = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const expiry = await expiryService.expiry_list_card_data(data);
  
        return res.json(expiry);
      
      } catch (error) {
      console.error("Error fetching expiry_list_card_data:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.get_credit_notes = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const creditNote = await expiryService.get_credit_notes(data);
  
        return res.json(creditNote);
      
      } catch (error) {
      console.error("Error fetching get_credit_note:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}

exports.redeem_cn = async (req, res) => {
  try {
      const data ={...req.query,...req.user}
      const creditNote = await expiryService.redeem_cn(data);
  
        return res.json(creditNote);
      
      } catch (error) {
      console.error("Error fetching redeem_cn:", error);
      return res.status(500).json({ status:message.code500,message:error.message });
    }
}