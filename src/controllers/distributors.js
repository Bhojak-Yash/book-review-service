const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const DistributorService = require('../services/distrubuterService');


exports.createDistributor = async (req, res) => {

  try {
    const data = req.body
    const distributor = await DistributorService.createDistributors(data);

    // if (!distributor) {
      return res.json({ status:distributor.status,message:distributor.message, });
    // }

    // return res.status(200).json({ status:message.code200,message: "Distributer created successfully." });
  } catch (error) {
    console.error("Error fetching createDistributor:", error);
    return res.status(500).json({ status:message.code500,message: "Failed to create distributer", error: error.message });
  }
};

exports.updateDistributors = async (req, res) => {

  try {
    const data = req.body
    const distributor = await DistributorService.updateDistributors(data);

    return res.json({ status:distributor.status,message:distributor.message, });

    // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
  } catch (error) {
    console.error("Error fetching Stock details:", error);
    return res.status(500).json({ status:message.code500,message: "Failed to update distributer", error: error.message });
  }
};

exports.getManufacturer = async (req, res) => {

  try {
    const data = {...req.user,...req.query}
    const distributor = await DistributorService.getManufacturer(data);

    return res.json(distributor);

    // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
  } catch (error) {
    console.error("getManufacturer Error:", error.message);
    return res.status(500).json({ status:message.code500,message: "Failed to update distributer", error: error.message });
  }
};
exports.getStocksByManufacturer = async (req, res) => {

  try {
    const data = {...req.user,...req.query}
    const distributor = await DistributorService.getStocksByManufacturer(data);

    return res.json(distributor);

    // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
  } catch (error) {
    console.error("getStocksByManufacturer Error:", error.message);
    return res.status(500).json({ status:message.code500,message: "Failed to update distributer", error: error.message });
  }
};