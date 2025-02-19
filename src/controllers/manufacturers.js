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
      return res.json({ status:manufacturer.status,message:manufacturer.message, });
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

      return res.json({ status:manufacturer.status,message:manufacturer.message, });
   
  } catch (error) {
    console.error("Error updateManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.getManufacturer = async (req, res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.getManufacturer(data);

      return res.json({ status:manufacturer.status,message:manufacturer.message,apiData:manufacturer?.apiData || null });
   
  } catch (error) {
    console.error("Error getManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.prchaseOrders = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const manufacturer = await ManufacturerService.prchaseOrders(data);

      return res.json(manufacturer);
   
  } catch (error) {
    console.error("Error prchaseOrders:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};

exports.cnf_details = async (req, res) => {
  try {
    const data = {...req.query,...req.user};
    const cnf = await ManufacturerService.cnf_details(data);

      return res.json(cnf);
   
  } catch (error) {
    console.error("Error cnf_details:", error);
    return res.status(500).json({ status:message.code500,message:error.message });
  }
};