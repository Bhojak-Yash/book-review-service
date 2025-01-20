const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Manufacturers = db.manufacturers;

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

exports.createManufacturer=async (req,res) => {
  let transaction;
  try {
    const { userName, password, companyName } = req.body;
    
    if (!userName || !password || !companyName) {
      return res.json({
        status: message.code400,
        message: "All fields are required",
      });
    }
    transaction = await db.sequelize.transaction();

    const hashedPassword = await hashPassword(password);

    const user = await Users.create(
      {
        userName: userName,
        password: hashedPassword,
        userType: userType,
        status:"Active"
      },
      { transaction }
    );

    await Manufacturers.create(
      {
          manufacturerId: user.id, 
          companyName: companyName,
      },
      { transaction }
      );

      await transaction.commit();
      res.json({
        status: message.code200,
        message: message.message200,
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.log('createManufacturer error:',error.message)
    res.json({
      status:message.code500,
      message:message.message500
    })
  }
};

exports.updateManufacturer = async (req, res) => {
    try {
      const { manufacturerId, logo, companyName, ownerName, email, phone, address, GST,licence } = req.body;
  
      if (!manufacturerId) {
        return res.json({
          status: message.code400,
          message: "Manufacturer ID is required",
        });
      }
  
      const manufacturer = await Manufacturers.findByPk(manufacturerId);
  
      if (!manufacturer) {
        return res.json({
          status: message.code404,
          message: "Manufacturer not found",
        });
      }
  
      // Update manufacturer details
      await manufacturer.update({
        logo: logo || manufacturer.logo,
        companyName: companyName || manufacturer.companyName,
        ownerName: ownerName || manufacturer.ownerName,
        email: email || manufacturer.email,
        phone: phone || manufacturer.phone,
        address: address || manufacturer.address,
        GST: GST || manufacturer.GST,
        licence:licence || manufacturer.licence,
      });
  
      res.json({
        status: message.code200,
        message: "Manufacturer details updated successfully",
      });
    } catch (error) {
      console.log("updateManufacturer error:", error.message);
      res.json({
        status: message.code500,
        message: message.message500,
      });
    }
};

