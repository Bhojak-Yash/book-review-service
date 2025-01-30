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
    return res.status(500).json({ status:message.code500,message: "Failed to create Manufacturer", error: error.message });
  }
};

exports.updateManufacturer = async (req, res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.updateManufacturer(data);

      return res.json({ status:manufacturer.status,message:manufacturer.message, });
   
  } catch (error) {
    console.error("Error fetching updateManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: "Failed to update manufacturer", error: error.message });
  }
};

exports.getManufacturer = async (req, res) => {
  try {
    const data = req.body
    const manufacturer = await ManufacturerService.getManufacturer(data);

      return res.json({ status:manufacturer.status,message:manufacturer.message,apiData:manufacturer?.apiData || null });
   
  } catch (error) {
    console.error("Error fetching updateManufacturer:", error);
    return res.status(500).json({ status:message.code500,message: "Failed to update manufacturer", error: error.message });
  }
};