const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const sequelize =db.sequelize
const Manufacturers = db.manufacturers;
const Address = db.address;
const Documents=db.documents;

async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

class ManufacturerService {
    constructor(db) {
      this.db = db;
    }
  
    async getAuthorizedDistributors(manufacturerId) {
      // Fetch all authorizations for the given manufacturer
      const authorizations = await this.db.authorizations.findAll({
        where: {
          authorizedBy: manufacturerId,
          status: "Approved", // Only fetch approved authorizations
        },
      });
  
      if (!authorizations || authorizations.length === 0) {
        return [];
      }
  
      // Extract the distributor IDs from the authorizations
      const distributorIds = authorizations.map((auth) => auth.authorizedId);
  
      // Fetch distributor details for the authorized distributors
      const distributors = await this.db.distributors.findAll({
        where: {
          distributorId: {
            [this.db.Sequelize.Op.in]: distributorIds, // Use Sequelize `Op.in` operator
          },
        },
        attributes: [
          "distributorId",
          "distributorCode",
          "companyName",
          "ownerName",
          "address",
          "phone",
          "email",
          "licence",
          "profilePic",
          "GST",
        ], // Only fetch required fields
      });
  
      return distributors;
    }

    async createManufacturer(data){
      let transaction;
      try {
        const { userName, password, companyName } = data;
        
        if (!userName || !password || !companyName) {
          return {
            status: message.code400,
            message: "All fields are required",
          }
        }
        transaction = await db.sequelize.transaction();
    
        const hashedPassword = await hashPassword(password);
    
        const user = await Users.create(
          {
            userName: userName,
            password: hashedPassword,
            userType: 'Manufacturer',
            status:"Active"
          },
          { transaction }
        );
    
        await sequelize.query(
          'INSERT INTO manufacturers (manufacturerId, companyName, createdAt, updatedAt) VALUES (:manufacturerId, :companyName, :createdAt, :updatedAt)',
          {
            replacements: { 
              manufacturerId: user.id, 
              companyName: companyName, 
              createdAt: new Date(), // Set the current timestamp
              updatedAt: new Date()  // Set the current timestamp
            },
            transaction, // Pass the transaction here
          }
        );
        
    
          await transaction.commit();
         return {
            status: message.code200,
            message: message.message200,
          }
      } catch (error) {
        if (transaction) await transaction.rollback();
        console.log('createManufacturer error:',error.message)
       return {
          status:message.code500,
          message:message.message500
        }
      }
    }

    async updateManufacturer(data){
      let transaction;
      try {
        const { manufacturerId, logo, companyName,companyType, ownerName, email, phone, address, GST,licence,PAN,CIN,drugLicense,fssaiLicense,wholesaleLicense,businessAdd,billingAdd,documents } = data;
    
        if (!manufacturerId) {
          return {
            status: message.code400,
            message: "Manufacturer ID is required",
          }
        }
        transaction = await db.sequelize.transaction();
        const manufacturer = await db.sequelize.query(
          `SELECT 
             *
           FROM manufacturers
           WHERE manufacturerId = :manufacturerId`,
          {
            replacements: { manufacturerId },
            type: db.Sequelize.QueryTypes.SELECT, // Ensures the query returns plain data
            transaction, // Pass the transaction if needed
          }
        );
        
        // Ensure you get a single object, not an array
        const manufacturerDetails = manufacturer.length > 0 ? manufacturer[0] : null;
    
        if (!manufacturer) {
          return {
            status: 404,
            message: "Manufacturer not found",
          }
        }
    
        // Update manufacturer details
        await db.sequelize.query(
          `UPDATE manufacturers 
           SET 
              logo = COALESCE(:logo, logo),
              companyName = COALESCE(:companyName, companyName),
              companyType = COALESCE(:companyType, companyType),
              ownerName = COALESCE(:ownerName, ownerName),
              email = COALESCE(:email, email),
              phone = COALESCE(:phone, phone),
              address = COALESCE(:address, address),
              GST = COALESCE(:GST, GST),
              licence = COALESCE(:licence, licence),
              PAN = COALESCE(:PAN, PAN),
              CIN = COALESCE(:CIN, CIN),
              drugLicense = COALESCE(:drugLicense, drugLicense),
              fssaiLicense = COALESCE(:fssaiLicense, fssaiLicense),
              wholesaleLicense = COALESCE(:wholesaleLicense, wholesaleLicense),
              updatedAt = NOW() -- Automatically update the timestamp
           WHERE manufacturerId = :manufacturerId`,
          {
            replacements: {
              manufacturerId,
              logo,
              companyName,
              companyType,
              ownerName,
              email,
              phone,
              address,
              GST,
              licence,
              PAN,
              CIN,
              drugLicense,
              fssaiLicense,
              wholesaleLicense,
            },
            transaction, // Pass the transaction here
          }
        );
        
        const add = {
          userId:manufacturerId,
          addressType:'Business',
          name:businessAdd.name,
          mobile:businessAdd.mobile,
          email:businessAdd.email,
          webURL:businessAdd.webURL,
          addLine1:businessAdd.addLine1,
          addLine2:businessAdd.addLine2,
          city:businessAdd.city,
          state:businessAdd.state,
          country:businessAdd.country,
          pincode:businessAdd.pincode
        }
        const add2 = {
          userId:manufacturerId,
          addressType:'Billing',
          name:billingAdd.name,
          mobile:billingAdd.mobile,
          email:billingAdd.email,
          webURL:billingAdd.webURL,
          addLine1:billingAdd.addLine1,
          addLine2:billingAdd.addLine2,
          city:billingAdd.city,
          state:billingAdd.state,
          country:billingAdd.country,
          pincode:billingAdd.pincode
        }
    let dataToInsert = [add,add2]
    await Address.bulkCreate(dataToInsert,{transaction})
    await db.sequelize.query(
      `INSERT INTO documents 
       (documnetId, PAN, GST, CIN, manufacturingLicense, drugLicense, ISO, createdAt, updatedAt)
       VALUES 
       (:documnetId, :PAN, :GST, :CIN, :manufacturingLicense, :drugLicense, :ISO, NOW(), NOW())`,
      {
        replacements: {
          documnetId: 1,
          PAN: "ABCDE1234F",
          GST: "29ABCDE1234F1Z5",
          CIN: "U12345KA2023PTC012345",
          manufacturingLicense: "MFG12345",
          drugLicense: "DRUG12345",
          ISO: "ISO9001:2023",
        },
        transaction, // Pass the transaction here
      }
    );
    

    await transaction.commit();
       return {
          status: message.code200,
          message: "Manufacturer details updated successfully",
        }
      } catch (error) {
        if (transaction) await transaction.rollback();
        console.log("updateManufacturer error:", error.message);
        return {
          status: message.code500,
          message: message.message500,
        }
      }
    }
  }
  
  // module.exports = ManufacturerService;
  module.exports = new ManufacturerService(db);