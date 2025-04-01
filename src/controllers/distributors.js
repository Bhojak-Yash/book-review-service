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
    return res.status(500).json({ status:message.code500,message:  error.message });
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
    return res.status(500).json({ status:message.code500,message: error.message });
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
    return res.status(500).json({ status:message.code500,message:  error.message });
  }
};

exports.po_page_data = async (req, res) => {

  try {
    const data = {...req.user,...req.query}
    const distributor = await DistributorService.po_page_data(data);

    return res.json(distributor);

    // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
  } catch (error) {
    console.error("po_page_data Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};

exports.so_page_data = async (req, res) => {

  try {
    const data = {...req.user,...req.query}
    const distributor = await DistributorService.so_page_data(data);

    return res.json(distributor);

    // return res.status(200).json({ status:message.code200,message: "Distributer updated successfully." });
  } catch (error) {
    console.error("so_page_data Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
};
exports.distributor_profile = async (req,res) => {
  try {
    const data = {...req.user,...req.query}
    const distributor = await DistributorService.distributor_profile(data);

    return res.json(distributor);
  } catch (error) {
    console.error("distributor_profile Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
}

exports.update_distributor = async (req,res) => {
  try {
    const data = {...req.user,...req.body}
    const distributor = await DistributorService.update_distributor(data);

    return res.json(distributor);
  } catch (error) {
    console.error("update_distributor Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
}

exports.check_profile = async (req,res) => {
  try {
    const data = {...req.user,...req.body}
    const distributor = await DistributorService.check_profile(data);

    return res.json(distributor);
  } catch (error) {
    console.error("check_profile Error:", error.message);
    return res.status(500).json({ status:message.code500,message: error.message });
  }
}

exports.update_distributorType = async (req, res) => {
  try {
    const userIdFromToken = req.user.id; 
    const data = req.body; 

    const distributor = await DistributorService.update_distributorType(data, userIdFromToken);

    return res.json(distributor);
  } catch (error) {
    console.error("update_distributorType Error:", error.message);
    return res.status(500).json({ status: message.code500, message: error.message });
  }
};

//Employee Management..........................................................


exports.create_role = async (req, res) => {
  try {
    const userIdFromToken = req.user.id; 
    const data = req.body; 

    const distributor = await DistributorService.create_role(data, userIdFromToken);

    return res.json(distributor);
  } catch (error) {
    console.error("create_role Error:", error.message);
    return res.status(500).json({ status: message.code500, message: error.message });
  }
};

exports.get_roles = async (req, res) => {
  try {
    const data = req.query; 

    const roles = await DistributorService.get_roles(data);
    
    return res.json({ status: "success", message: "Roles fetched successfully", data: roles });
  } catch (error) {
    console.error("get_roles Error:", error.message);
    return res.status(500).json({ status: message.code500, message: error.message });
  }
};

exports.update_roles = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body; 

    if (!id) {
      return res.status(400).json({ status: "error", message: "Role ID is required." });
    }

    const roles = await DistributorService.update_roles(id, data);

    if (!roles) {
      return res.status(404).json({ status: "error", message: "Role not found." });
    }

    return res.json({ status: "success", message: "Role updated successfully", data: roles });
  } catch (error) {
    console.error("update_roles Error:", error.message);
    return res.status(500).json({ status: "error", message: error.message });
  }
};



