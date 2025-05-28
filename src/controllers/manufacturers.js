const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Manufacturers = db.manufacturers;
const ManufacturerService = require('../services/manufacturerService')

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

exports.createManufacturer=async (req,res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.createManufacturer(data);

    // if (!distributor) {
      return res.status(manufacturer?.status || 200).json({ status:manufacturer.status,message:manufacturer.message, });
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createManufacturer:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.updateManufacturer = async (req, res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.updateManufacturer(data);

      return res.status(manufacturer?.status || 200).json({ status:manufacturer.status,message:manufacturer.message, });
   
  } catch (error) {
    console.error("Error updateManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.getManufacturer = async (req, res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.getManufacturer(data);

      return res.status(manufacturer.status || 200).json({ status:manufacturer.status,message:manufacturer.message,apiData:manufacturer?.apiData || null });
   
  } catch (error) {
    console.error("Error getManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.prchaseOrders = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const manufacturer = await ManufacturerService.prchaseOrders(data);

      // return res.json(manufacturer);
      return res.status(manufacturer?.status || 200).json(manufacturer);
   
  } catch (error) {
    console.error("Error prchaseOrders:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.cnf_details = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const cnf = await ManufacturerService.cnf_details(data);

    return res.status(cnf?.status || 200).json(cnf);
   
  } catch (error) {
    console.error("Error cnf_details:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.distributers_cnf_summary = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const cnf = await ManufacturerService.distributers_cnf_summary(data);

    return res.status(cnf?.status || 200).json(cnf);
   
  } catch (error) {
    console.error("Error cnf_details:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.po_page_card_data = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const cnf = await ManufacturerService.po_page_card_data(data);

    return res.status(cnf?.status || 200).json(cnf);
   
  } catch (error) {
    console.error("Error po_page_card_data:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.linked_users = async(req, res) =>{
  try{
    const data = {
      ...req.user,
      page: req.query.page,
      limit: req.query.limit
    };
    const result = await ManufacturerService.linked_users(data);

    return res.status(result?.status || 200).json(result);
    
  } catch(error){
    console.error("Error linked_users: ", error);
    return res.status(500).json({
      status: message.code500, 
      message: error.message 
    });
  }
};