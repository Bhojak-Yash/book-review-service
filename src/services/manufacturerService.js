const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const sequelize = db.sequelize
const Manufacturers = db.manufacturers;
const Address = db.address;
const Documents = db.documents;

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

  async createManufacturer(data) {
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
          status: "Active"
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
      console.log('createManufacturer error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async updateManufacturer(data) {
    let transaction;
    try {
      const { manufacturerId, logo, companyName, companyType, ownerName, email, phone, address, GST, licence, PAN, CIN, drugLicense, fssaiLicense, wholesaleLicense, businessAdd, billingAdd, documents } = data;

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

      const existingAddresses = await Address.findAll({
        where: { userId: manufacturerId },
        transaction,
      });

      if (existingAddresses.length) {
        // Update existing addresses
        await Promise.all(
          existingAddresses.map(async (existingAddress) => {
            const updateData =
              existingAddress.addressType === "Business" ? businessAdd : billingAdd;
            await existingAddress.update(updateData, { transaction });
          })
        );
      } else {
        // Insert new addresses
        let dataToInsert = [
          { ...businessAdd, userId: manufacturerId, addressType: "Business" },
          { ...billingAdd, userId: manufacturerId, addressType: "Billing" },
        ];
        await Address.bulkCreate(dataToInsert, { transaction });
      }

      // ------------------------ Document Handling ------------------------

      // Check if documents exist
      const existingDocument = await db.sequelize.query(
        `SELECT * FROM documents WHERE userId = :manufacturerId`,
        {
          replacements: { manufacturerId },
          type: db.Sequelize.QueryTypes.SELECT,
          transaction,
        }
      );

      if (existingDocument.length) {
        // Update document
        await db.sequelize.query(
          `UPDATE documents 
             SET PAN = :PAN, GST = :GST, CIN = :CIN, 
                 manufacturingLicense = :manufacturingLicense, drugLicense = :drugLicense, 
                 ISO = :ISO, updatedAt = NOW()
             WHERE userId = :manufacturerId`,
          {
            replacements: {
              manufacturerId,
              PAN: documents.PAN,
              GST: documents.GST,
              CIN: documents.CIN,
              manufacturingLicense: documents.manufacturingLicense,
              drugLicense: documents.drugLicense,
              ISO: documents.ISO,
            },
            transaction,
          }
        );
      } else {
        // Insert document
        await db.sequelize.query(
          `INSERT INTO documents 
             ( userId, PAN, GST, CIN, manufacturingLicense, drugLicense, ISO, createdAt, updatedAt)
             VALUES 
             ( :manufacturerId, :PAN, :GST, :CIN, :manufacturingLicense, :drugLicense, :ISO, NOW(), NOW())`,
          {
            replacements: {
              manufacturerId,
              PAN: documents.PAN,
              GST: documents.GST,
              CIN: documents.CIN,
              manufacturingLicense: documents.manufacturingLicense,
              drugLicense: documents.drugLicense,
              ISO: documents.ISO,
            },
            transaction,
          }
        );
      }

      await transaction.commit();
      return {
        status: message.code200,
        message: "Manufacturer details updated successfully",
      };
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.log("updateManufacturer error:", error.message);
      return {
        status: message.code500,
        message: message.message500,
      };
    }
  }
  async getManufacturer(data) {
    try {
      const { manufacturerId } = data;
      if (!manufacturerId) {
        return {
          status: message.code400,
          message: "Manufacturer ID is required",
        };
      }
  
      // Fetch allowed document columns
      const [aa] = await sequelize.query(
        `SELECT documentName FROM documentCategory WHERE category = 'Manufacturer'`
      );
      const ddd=await Manufacturers.find({where:{category:'Manufacturer'}})
  console.log(ddd,';;;;;;;;')
      let columns = [];
      if (aa) {
        columns = aa.map((item) => item.documentName);
      }
  
      // Ensure column names are safely wrapped in backticks
      const documentColumns = columns.length > 0 ? columns.map(col => `doc.\`${col}\``).join(", ") : '';
  
      const documentColumnsQuery = documentColumns ? `, ${documentColumns}` : '';
  
      const query = `
        SELECT 
          mn.*, 
          us.*, 
          ad.* 
          ${documentColumnsQuery} 
        FROM crm_db.manufacturers AS mn
        LEFT JOIN crm_db.users AS us 
          ON mn.manufacturerId = us.id
        LEFT JOIN crm_db.address AS ad
          ON mn.manufacturerId = ad.userId
        LEFT JOIN crm_db.documents AS doc
          ON doc.userId = mn.manufacturerId
        WHERE mn.manufacturerId = ${manufacturerId};
      `;
  
      const [dataa] = await sequelize.query(query);
      const transformedData = {};
  
      dataa.forEach((row) => {
        const manufacturerId = row.manufacturerId;
  
        if (!transformedData[manufacturerId]) {
          transformedData[manufacturerId] = {
            manufacturer: {
              companyName: row.companyName,
              ownerName: row.ownerName,
              logo: row.logo,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
              address: row.address,
              phone: row.phone,
              email: row.email,
              GST: row.GST,
              manufacturerId: row.manufacturerId,
              licence: row.licence,
              companyType: row.companyType,
              PAN: row.PAN,
              CIN: row.CIN,
              drugLicense: row.drugLicense,
              fssaiLicense: row.fssaiLicense,
              wholesaleLicense: row.wholesaleLicense,
              manufacturingLicense: row.manufacturingLicense,
              ISO: row.ISO,
            },
            user: {
              id: row.id,
              userName: row.userName,
              password: row.password,
              userType: row.userType,
              status: row.status,
              deletedAt: row.deletedAt,
              isPasswordChangeRequired: row.isPasswordChangeRequired,
            },
            addresses: {},
            documents: {},
          };
        }
  
        // Add addresses with addressType as key
        if (row.addressType) {
          transformedData[manufacturerId].addresses[row.addressType] = {
            addressId: row.addressId,
            userId: row.userId,
            name: row.name,
            mobile: row.mobile,
            webURL: row.webURL,
            addLine1: row.addLine1,
            addLine2: row.addLine2,
            city: row.city,
            State: row.State,
            country: row.country,
            pinCode: row.pinCode,
          };
        }
  
        // Add documents (only specific columns that were dynamically added)
        columns.forEach((col) => {
          if (row[col] !== undefined) {
            transformedData[manufacturerId].documents[col] = row[col];
          }
        });
      });
  
      // Convert transformedData object to an array
      const result = Object.values(transformedData);
  
      console.log(result);
  
      return {
        status: message.code200,
        message: message.message200,
        apiData: result,
      };
    } catch (error) {
      console.log("getManufacturer error:", error.message);
      return {
        status: message.code500,
        message: message.message500,
      };
    }
  }
  
}

// module.exports = ManufacturerService;
module.exports = new ManufacturerService(db);