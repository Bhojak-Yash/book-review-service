const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;


exports.updateDistributors = async (req, res) => {
    try {
      const { distributorid, logo, companyName, ownerName, email, phone, address, GST,licence } = req.body;
  
      if (!distributorid) {
        return res.json({
          status: message.code400,
          message: "Distributor ID is required",
        });
      }
  
      const distributor = await Distributors.findByPk(distributorid);
  
      if (!distributor) {
        return res.json({
          status: message.code404,
          message: "Distributor not found",
        });
      }
  
      // Update manufacturer details
      await distributor.update({
        logo: logo || distributor.logo,
        companyName: companyName || distributor.companyName,
        ownerName: ownerName || distributor.ownerName,
        email: email || distributor.email,
        phone: phone || distributor.phone,
        address: address || distributor.address,
        GST: GST || distributor.GST,
        licence:licence || distributor.licence,
      });
  
      res.json({
        status: message.code200,
        message: "Distributor details updated successfully",
      });
    } catch (error) {
      console.log("updateDistributor error:", error.message);
      res.json({
        status: message.code500,
        message: message.message500,
      });
    }
  };


