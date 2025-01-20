const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}


exports.createDistributor = async (req,res) => {
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

    await Distributors.create(
      {
          distributorId: user.id,
          companyName: companyName,
      },
      { transaction }
      );
       // Commit the transaction
      await transaction.commit();
      res.json({
        status: message.code200,
        message: message.message200,
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.log('createDistributor error:',error.message)
    res.json({
      status:message.code500,
      message:message.message500
    })
  }
}

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


