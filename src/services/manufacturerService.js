const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const { where } = require('sequelize');
const Users = db.users;
const sequelize = db.sequelize
const Manufacturers = db.manufacturers;
const Address = db.address;
const Documents = db.documents;
const Op = db.Op

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

      const manufacturerCode = `MAN-${user.id}`;

      await sequelize.query(
        'INSERT INTO manufacturers (manufacturerCode, manufacturerId, companyName, createdAt, updatedAt) VALUES (:manufacturerCode, :manufacturerId, :companyName, :createdAt, :updatedAt)',
        {
          replacements: {
            manufacturerCode: manufacturerCode,
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
      // const existingDocument = await db.sequelize.query(
      //   `SELECT * FROM documents WHERE userId = :manufacturerId`,
      //   {
      //     replacements: { manufacturerId },
      //     type: db.Sequelize.QueryTypes.SELECT,
      //     transaction,
      //   }
      // );

      // if (existingDocument.length) {
      //   // Update document
      //   await db.sequelize.query(
      //     `UPDATE documents 
      //        SET PAN = :PAN, GST = :GST, CIN = :CIN, 
      //            manufacturingLicense = :manufacturingLicense, drugLicense = :drugLicense, 
      //            ISO = :ISO, updatedAt = NOW()
      //        WHERE userId = :manufacturerId`,
      //     {
      //       replacements: {
      //         manufacturerId,
      //         PAN: documents.PAN,
      //         GST: documents.GST,
      //         CIN: documents.CIN,
      //         manufacturingLicense: documents.manufacturingLicense,
      //         drugLicense: documents.drugLicense,
      //         ISO: documents.ISO,
      //       },
      //       transaction,
      //     }
      //   );
      // } else {
      //   // Insert document
      //   await db.sequelize.query(
      //     `INSERT INTO documents 
      //        ( userId, PAN, GST, CIN, manufacturingLicense, drugLicense, ISO, createdAt, updatedAt)
      //        VALUES 
      //        ( :manufacturerId, :PAN, :GST, :CIN, :manufacturingLicense, :drugLicense, :ISO, NOW(), NOW())`,
      //     {
      //       replacements: {
      //         manufacturerId,
      //         PAN: documents.PAN,
      //         GST: documents.GST,
      //         CIN: documents.CIN,
      //         manufacturingLicense: documents.manufacturingLicense,
      //         drugLicense: documents.drugLicense,
      //         ISO: documents.ISO,
      //       },
      //       transaction,
      //     }
      //   );
      // }

      const documentsData = documents.map((doc) => ({
        categoryId: doc.id,
        image: doc.image,
        status: 'Verified',
        userId: Number(manufacturerId)
      }));

      await db.documents.bulkCreate(documentsData, {
        updateOnDuplicate: ["image", 'status'],
        conflictFields: ["categoryId", "userId"]
      });

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
      const document = await db.documentCategory.findAll({
        attributes: ['id', 'documentName'],
        include: [
          {
            model: db.documents,
            as: "documnets",
            attributes: ['image', "status", 'updatedAt'],
            where: {
              userId: Number(manufacturerId)
            },
            required: false,
          },
        ],
        where: { category: "Manufacturer" }
      })
      // const ddd=await Manufacturers.find({where:{category:'Manufacturer'}})
      // console.log(ddd,';;;;;;;;')
      let columns = [];
      if (aa) {
        columns = aa.map((item) => item.documentName);
      }

      // Ensure column names are safely wrapped in backticks
      const documentColumns = columns.length > 0 ? columns.map(col => `doc.\`${col}\``).join(", ") : '';

      const documentColumnsQuery = documentColumns ? `, ${documentColumns}` : '';

      const query = `
        SELECT 
          mn.companyName, 
    mn.ownerName, 
    mn.logo, 
    mn.createdAt, 
    mn.updatedAt, 
    mn.address, 
    mn.phone, 
    mn.email, 
    mn.GST as gst, 
    mn.manufacturerId, 
    mn.licence, 
    mn.companyType, 
    mn.PAN as pan, 
    mn.CIN as cin, 
    mn.drugLicense as dlicense, 
    mn.fssaiLicense as flicense, 
    mn.wholesaleLicense as wholesalelicense, 
          us.*, 
          ad.*
        FROM crm_db.manufacturers AS mn
        LEFT JOIN crm_db.users AS us 
          ON mn.manufacturerId = us.id
        LEFT JOIN crm_db.address AS ad
          ON mn.manufacturerId = ad.userId
        WHERE mn.manufacturerId = ${manufacturerId};
      `;

      const [dataa] = await sequelize.query(query);
      const transformedData = {};
      // console.log(dataa)
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
              GST: row.gst,
              manufacturerId: row.manufacturerId,
              licence: row.licence,
              companyType: row.companyType,
              PAN: row.pan,
              CIN: row.cin,
              drugLicense: row.dlicense,
              fssaiLicense: row.flicense,
              wholesaleLicense: row.wholesalelicense,
              // manufacturingLicense: row.manufacturingLicense,
              // ISO: row.iso,
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
            email: row.email,
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

        transformedData[manufacturerId].documents = document
        // Add documents (only specific columns that were dynamically added)
        // columns.forEach((col) => {
        //   if (row[col] !== undefined) {
        //     transformedData[manufacturerId].documents[col] = row[col];
        //   }
        // });
      });

      // Convert transformedData object to an array
      const result = Object.values(transformedData);

      // console.log(result);

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

  async prchaseOrders(data) {
    try {
      let Page = Number(data.page) || 1
      let Limit = Number(data.limit) || 10
      let Skip = 0
      let StartDate = new Date()
      let EndDate = new Date()

      if (Page > 1) {
        Skip = (Page - 1) * Limit
      }
      let whereCondition = { orderTo: Number(data.id) }
      if (data?.status) {
        if (data?.status === 'Unpaid') {
          whereCondition.balance = { [Op.gt]: 0 }
        } else {
          whereCondition.orderStatus = data.status
        }
      }
      if (data?.search) {
        whereCondition[Op.or] = [
          { id: { [Op.like]: `%${data.search}%` } },
          { orderFrom: { [Op.like]: `%${data.search}%` } }
        ];
      }
      if (data?.distributorId) {
        whereCondition.orderFrom = Number(data.distributorId)
      }
      if (data.start_date && data.end_date) {
        const startDateParts = data.start_date.split('-'); // Split "02-09-2025" -> ["02", "09", "2025"]
        const endDateParts = data.end_date.split('-');

        const formattedStartDate = `${startDateParts[2]}-${startDateParts[1]}-${startDateParts[0]} 00:00:00`; // "2025-09-02 00:00:00"
        const formattedEndDate = `${endDateParts[2]}-${endDateParts[1]}-${endDateParts[0]} 23:59:59`; // "2025-09-02 23:59:59"

        whereCondition.OrderDate = {
          [Op.between]: [new Date(formattedStartDate), new Date(formattedEndDate)]
        };
      }
      // console.log(whereCondition)
      const totalData = await db.orders.count({ where: whereCondition })
      const result = await db.orders.findAll({
        attributes: ['id', 'orderDate', 'dueDate', 'deliveredAt', 'orderTotal', 'invAmt', 'orderFrom', 'orderStatus', 'orderTo', 'dMan', 'dMobile', 'deliveryType'],
        where: whereCondition,
        include: [
          {
            model: db.distributors,
            as: 'distributer',
            attributes: ['distributorId', 'companyName']
          }
        ],
        order: [['id', 'DESC']],
        limit: Limit,
        offset: Skip
      })

      // const updateResult = result.map((item) => {
      //   const plainItem = item.toJSON(); // Convert to plain object

      //   let deliveryType =
      //     plainItem.orderStatus === 'Ready to ship' ? 'Shipped' :
      //       plainItem.orderStatus === 'Ready to pickup' ? 'Pickup' :
      //         null;

      //   return { ...plainItem, deliveryType };
      // })
      const totalPage = Math.ceil(Number(totalData) / Limit)

      return {
        status: message.code200,
        message: message.message200,
        currentPage: Page,
        totalPage: totalPage,
        totalData: totalData,
        apiData: result || null
      }
    } catch (error) {
      console.log('prchaseOrders service error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async cnf_details(data) {
    try {
      const id = Number(data.distributorId)

      const result = await db.distributors.findOne({
        attributes: ['distributorId', 'status', "phone", "email", "GST", "CIN"],
        include: [
          {
            model: db.address,
            as: "addresses",
          }
        ],
        where: { distributorId: id }
      })
      const orders = await db.orders.findAndCountAll({
        where: { orderFrom: id },
        limit: 1,  // Get the latest order
        order: [["createdAt", "DESC"]], // Sort by createdAt descending (latest first)
        raw: true
      });

      const totalOrders = orders.count;
      const latestCreatedAt = orders.rows.length > 0 ? orders.rows[0].createdAt : null;

      // console.log({ totalOrders, latestCreatedAt });
      const completeOrder = await db.orders.count({
        where: {
          orderFrom: id,
          orderStatus: { [Op.in]: ["Received", "Paid", "Partial Paid"] }
        },
        raw: true
      });
      const sumOfOrders = await db.orders.findOne({
        attributes: [[db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.col("InvAmt")), 0), "totalInvAmt"],
        [db.sequelize.fn("COALESCE", db.sequelize.fn("SUM", db.sequelize.col("balance")), 0), "pendingPayment"]
        ], where: { orderFrom: Number(id) }
      })
      // console.log(orders)
      return {
        status: message.code200,
        message: message.message200,
        apiData: { result, totalOrders, latestCreatedAt, completeOrder, sumOfOrders }
      }
    } catch (error) {
      console.log('cnf_details service error', error.message)
      return {
        status: message.code500,
        messaage: message.message500
      }
    }
  }

  async distributers_cnf_summary(data) {
    try {
      const { id, start_date, end_date } = data;
      let whereClause = { authorizedBy: Number(id) };

      // Date range filter
      if (start_date && end_date) {
        whereClause.createdAt = {
          [Op.between]: [
            new Date(start_date + " 00:00:00"),
            new Date(end_date + " 23:59:59"),
          ],
        };
      }


      // Current period result
      let currentResult = await getcurrentResult(whereClause)
      let previousWhereClause = { authorizedBy: Number(id) };

      if (start_date && end_date) {
        let previousStartDate = new Date(start_date);
        let previousEndDate = new Date(end_date);

        // Calculate previous period range
        const diff = previousEndDate.getTime() - previousStartDate.getTime();
        previousStartDate.setTime(previousStartDate.getTime() - diff);
        previousEndDate.setTime(previousEndDate.getTime() - diff);

        previousWhereClause.createdAt = {
          [Op.between]: [previousStartDate, previousEndDate],
        };
      }

      let previousResult = await getcurrentResult(previousWhereClause)

      let changes = {
        disChange: (Number(Number(currentResult.dis || 0) - Number(previousResult.dis || 0)) / Number(previousResult.dis && previousResult.dis > 0 ? previousResult.dis : 1)) * 100,
        cnfChange: (Number(Number(currentResult.cnf || 0) - Number(previousResult.cnf || 0)) / Number(previousResult.cnf && previousResult.cnf > 0 ? previousResult.cnf : 1)) * 100,
        PendingCountChange: (Number(Number(currentResult.pendingCount || 0) - Number(previousResult.pendingCount || 0)) / Number(previousResult.pendingCount && previousResult.pendingCount > 0 ? previousResult.pendingCount : 1)) * 100
      }

      const orders = await db.orders.count({ where: { orderTo: Number(id) } })

      let finalResult = { ...currentResult, ...changes, totalOrders: orders }

      return {
        status: message.code200,
        message: message.message200,
        apiData: finalResult,
      }
    } catch (error) {
      console.log('distributers_cnf_summary error:', error.message)
      return {
        status: message.code500,
        message: message.message500
      }
    }
  }

  async po_page_card_data(data) {
    try {
      const { id, userType } = data;
      const checkId = userType === "Manufacturer" ? data?.data?.employeeOf || id : id;

      // Parallelizing queries for better performance
      const [ordersCount, pendingCount, counts, pendingRequest, balanceData] = await Promise.all([
        db.orders.count({ where: { orderTo: Number(checkId) } }),
        db.orders.count({
          where: {
            orderTo: Number(checkId),
            orderStatus: { [Op.notIn]: ["Paid", "Received", "Partially paid"] },
          },
        }),
        db.authorizations.findAll({
          attributes: [
            "distributers.type",
            [db.sequelize.fn("COUNT", db.sequelize.col("authorizedId")), "count"],
          ],
          where: { authorizedBy: Number(id), status: "Approved" },
          include: [
            {
              model: db.distributors,
              as: "distributers",
              attributes: ["type"],
            },
          ],
          group: ["distributers.type"],
          raw: true,
        }),
        db.authorizations.count({ where: { authorizedBy: Number(checkId), status: "Pending" } }),
        db.orders.findOne({
          attributes: [
            [db.sequelize.fn("SUM", db.sequelize.col("balance")), "totalBalance"],
            [db.sequelize.fn("COUNT", db.sequelize.col("balance")), "totalCount"],
          ],
          where: { balance: { [db.Op.gt]: 0 } },
          raw: true,
        }),
      ]);

      const cnfCount = counts.find((item) => item["distributers.type"] === "CNF")?.count || 0;
      const distributorCount = counts.find((item) => item["distributers.type"] === "Distributor")?.count || 0;

      return {
        status: 200,
        message: "Data fetched successfully",
        data: {
          ordersCount,
          pendingCount,
          cnfCount,
          distributorCount,
          pendingRequest,
          totalBalance: balanceData?.totalBalance || 0,
          totalCount: balanceData?.totalCount || 0,
        },
      };
    } catch (error) {
      console.error("po_page_card_data service error:", error.message);
      return {
        status: 500,
        message: "Internal server error",
      };
    }
  }


}

async function getcurrentResult(whereClause) {
  let currentResult = await db.authorizations.findOne({
    attributes: [
      // [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalCount"],
      [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), "approvedCount"],
      [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), "rejectedCount"],
      [db.sequelize.fn("SUM", db.sequelize.literal(`CASE WHEN status = 'Pending' THEN 1 ELSE 0 END`)), "pendingCount"],
    ],
    where: whereClause,
    raw: true,
  }) || {};

  let whereCondition = { ...whereClause, status: 'Approved' }
  const counts = await db.authorizations.findAll({
    attributes: [
      "distributers.type",
      [db.sequelize.fn("COUNT", db.sequelize.col("authorizedId")), "count"],
    ],
    where: whereCondition,
    include: [
      {
        model: db.distributors,
        as: "distributers",
        attributes: ['type'],
      },
    ],
    group: ["distributers.type"],
    raw: true,
  });


  let distributorCount = 0;
  let cnfCount = 0;

  counts.forEach((item) => {
    if (item.type === "Distributor") {
      distributorCount = item.count;
    } else if (item.type === "CNF") {
      cnfCount = item.count;
    }
  });
  currentResult.cnf = cnfCount
  currentResult.dis = distributorCount
  return currentResult
}



// module.exports = ManufacturerService;
module.exports = new ManufacturerService(db);