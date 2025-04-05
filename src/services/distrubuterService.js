const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Distributors = db.distributors;
const Sequelize = require('sequelize');


async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

class DistributorService {
    constructor(db) {
        this.db = db;
    }

    async createDistributors(data) {
        let transaction;
        try {
            const { userName, password, companyName } = data;

            if (!userName || !password || !companyName) {
                return {
                    error: false,
                    status: message.code400,
                    message: "All fields are required",
                }
            }
            transaction = await db.sequelize.transaction();

            if (userName) {
                const existingUser = await db.users.findOne({ where: { userName: userName } }, { transaction });
                if (existingUser) {
                    throw new Error('A distributor with this email already exists.');
                }
            }

            const hashedPassword = await hashPassword(password);

            const user = await Users.create(
                {
                    userName: userName,
                    password: hashedPassword,
                    userType: 'Distributor',
                    status: "Active",
                },
                { transaction }
            );
            const distributorCode = `DIST-${user.id}`;

            await Distributors.create(
                {
                    distributorId: user.id,
                    companyName: companyName,
                    distributorCode: distributorCode,
                    type: "Distributor",
                    status: "Active"
                },
                { transaction }
            );
            // Commit the transaction
            await transaction.commit();
            return {
                error: false,
                status: message.code200,
                message: message.message200,
            }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('createDistributor error:', error.message)
            return {
                error: true,
                status: message.code500,
                message: error.message,
            }
        }
    }

    async updateDistributors(data) {
        try {
            const { distributorid, logo, companyName, ownerName, email, phone, address, GST, licence } = data;

            if (!distributorid) {
                return {
                    status: message.code400,
                    message: "Distributor ID is required",
                }
            }

            const distributor = await Distributors.findByPk(distributorid);

            if (!distributor) {
                return {
                    status: 404,
                    message: "Distributor not found",
                }
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
                licence: licence || distributor.licence,
            });

            return {
                status: message.code200,
                message: message.message200,
            }
        } catch (error) {
            console.log("updateDistributor error:", error.message);
            return {
                status: message.code500,
                message: error.message,
            }
        }
    }

    async getManufacturer(data) {
        try {
            const { id, search, type } = data;

            let checkUserType = ['Distributor', 'Manufacturer']
            if (type == 'cnf') {
                checkUserType = ['Distributor']
            } else if (type == 'manufacturer') {
                checkUserType = ['Manufacturer']
            }
            // Sanitize input values
            // const authorizedId = Number(id);
            // const searchQuery = search ? `%${search}%` : null;
            // console.log(id,authorizedId,searchQuery)
            // Construct the SQL query dynamically
            // let query = `
            //     SELECT mn.manufacturerId, mn.companyName 
            //     FROM crm_db.manufacturers as mn
            // `;

            // // Append search filter if provided
            // if (searchQuery) {
            //     query += ` where mn.companyName LIKE :searchQuery`;
            // }

            // // Execute the query using parameterized values
            // const Data = await db.sequelize.query(query, {
            //     replacements: { authorizedId, searchQuery },
            //     type: db.Sequelize.QueryTypes.SELECT
            // });
            // const userType = {
            //     [db.Op.or]: [
            //         { userType: 'Manufacturer' },
            //         { userType: 'Distributor' }
            //     ]
            // }


            const result = await db.users.findAll({
                attributes: ['id', 'userType'],
                include: [
                    {
                        model: db.distributors,
                        as: 'disuser',
                        attributes: ['companyName', 'distributorId'],
                        required: false,
                        where: {
                            type: 'CNF',
                            ...(search ? { companyName: { [db.Op.like]: `%${search}%` } } : {})
                        }
                    },
                    {
                        model: db.manufacturers,
                        as: 'manufacturer',
                        attributes: ['companyName', 'manufacturerId'],
                        required: false,
                        where: search ? { companyName: { [db.Op.like]: `%${search}%` } } : {}
                    }
                ],
                where: {
                    userType: { [db.Op.in]: checkUserType },
                    [db.Op.or]: [
                        { '$disuser.distributorId$': { [db.Op.ne]: null } },
                        { '$manufacturer.manufacturerId$': { [db.Op.ne]: null } }
                    ]
                }
            });

            const finalResult = result?.map((item) => {
                return {
                    "companyName": item.disuser.length ? item.disuser[0]?.companyName : item.manufacturer[0]?.companyName,
                    "manufacturerId": item.id,
                    "type": item.disuser.length ? 'CNF' : 'Manufacturer'
                }
            })



            return {
                status: message.code200,
                message: message.message200,
                apiData: finalResult
            };
        } catch (error) {
            console.log('getManufacturer service error:', error.message);
            return {
                status: 500,
                message: error.message
            };
        }
    }

    async getStocksByManufacturer(data) {
        try {
            console.log(data)
            const { id, manufacturerId, type, page, limit, search } = data
            console.log(id, manufacturerId)
            let whereStock = {}
            let whereCondition = {};
            let tablesearch = 'distributors_new'
            if (type == 'Manufacturer') {
                tablesearch = 'manufacturers'
                whereCondition.manufacturerId = Number(manufacturerId)
            } else {
                whereStock.organisationId = Number(manufacturerId)
            }

            if (search && search.trim() !== "") {
                whereCondition.PName = { [db.Sequelize.Op.like]: `%${search}%` };
            }
            const Page = Number(page) || 1
            const Limit = Number(limit) || 10
            let skip = 0
            if (Page > 1) {
                skip = (Page - 1) * Limit
            }
            // if (!manufacturerId) {
            //     return {
            //         status: 404,
            //         message: 'Manufacturer not found'
            //     }
            // }
            let manufacturer = {}
            const ccc = manufacturerId ? manufacturerId : id
            const idColumn =
                tablesearch === 'manufacturers' ? 'manufacturerId' : 'distributorId';
                const logoColumn =
                tablesearch === 'manufacturers' ? 'logo' : 'profilePic';
            if (id) {
                const [eee] = await db.sequelize.query(
                    `SELECT 
                    mn.${idColumn} as manufacturerId, 
                    mn.companyName,
                    mn.${logoColumn} as logo,
                    au.id AS authorizationId,
                    au.status, 
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'addressType', ad.addressType, 
                        'name', ad.name, 
                        'mobile', ad.mobile, 
                        'city', ad.city, 
                        'state', ad.state
                      )
                    ) AS addresses
                 FROM ${tablesearch} AS mn
                 LEFT JOIN authorizations AS au
                   ON mn.${idColumn} = au.authorizedBy AND au.authorizedId = :id
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.${idColumn}
                 WHERE mn.${idColumn}= :manufacturerId
                 GROUP BY mn.${idColumn}, mn.companyName, au.id, au.status`,
                    {
                        replacements: {
                            manufacturerId: Number(manufacturerId),
                            id: Number(id),
                        },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );
                // console.log(eee,manufacturerId,tablesearch)
                manufacturer = eee
            } else {
                const [eee] = await db.sequelize.query(
                    `SELECT 
                     mn.${idColumn} as manufacturerId,  
                    mn.companyName,
                     mn.${logoColumn} as logo,
                    JSON_ARRAYAGG(
                      JSON_OBJECT(
                        'addressType', ad.addressType, 
                        'name', ad.name, 
                        'mobile', ad.mobile, 
                        'city', ad.city, 
                        'state', ad.state
                      )
                    ) AS addresses
                 FROM ${tablesearch} AS mn
                 LEFT JOIN \`address\` AS ad
                   ON ad.userId = mn.${idColumn}
                 WHERE mn.${idColumn} = :manufacturerId
                 GROUP BY mn.${idColumn}, mn.companyName`,
                    {
                        replacements: {
                            manufacturerId: Number(ccc),
                            // id: Number(id),
                        },
                        type: db.Sequelize.QueryTypes.SELECT,
                    }
                );
                manufacturer = { ...eee, authorizationId: null, status: 'Not Send' }
            }
            console.log('ppppppp',manufacturer)
            if (manufacturer.status != 'Approved' && manufacturer.status != 'Not Send') {
                return {
                    status: 400,
                    message: "Not authorized"
                }
            }
            let tableName = db.manufacturerStocks
            if (type) {
                tableName = type === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
            }
            // console.log(whereStock, whereCondition)
            const { count, rows: stocks } = await tableName.findAndCountAll({
                attributes: ['SId', 'BatchNo', 'ExpDate', 'Scheme', 'MRP', 'PTS'],
                where: whereStock,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ['PId', 'PCode', "manufacturerId", 'PName', 'PackagingDetails', 'SaltComposition'],
                        where: whereCondition
                    }
                ],
                offset: skip,
                limit: Limit
            })
            // console.log(stocks)
            let ids = []
            const updatedStock = await stocks?.map((item) => {
                ids.push(item.SId)
                if (manufacturer.status === 'Approved') {
                    return {
                        "SId": item.SId,
                        "PId": item.product.PId,
                        "PCode": item.product.PCode,
                        "manufacturerId": item.product.manufacturerId,
                        "PName": item.product.PName,
                        "PCode": item.product.PCode,
                        "PackagingDetails": item.product.PackagingDetails,
                        "SaltComposition": item.product.SaltComposition,
                        // "PTR": item.PTR,
                        "PTS": item.PTS || 0,
                        "MRP": item.MRP,
                        "BatchNo": item.BatchNo,
                        "ExpDate": item.ExpDate,
                        "Scheme": item.Scheme
                    }
                } else {
                    return {
                        "SId": item.SId,
                        "PId": item.product.PId,
                        "PCode": item.product.PCode,
                        "manufacturerId": item.product.manufacturerId,
                        "PName": item.product.PName,
                        "PCode": item.product.PCode,
                        "PackagingDetails": item.product.PackagingDetails,
                        "SaltComposition": item.product.SaltComposition,
                        // "PTR": null,
                        "PTS": null,
                        "MRP": null,
                        "BatchNo": item.BatchNo,
                        "ExpDate": item.ExpDate,
                        "Scheme": null
                    }
                }
            })
            // console.log(ids)
            // const totalCount = await db.products.count({ where: whereCondition })
            let updatedStockWithQuantity = []
            if (id) {
                
                // console.log('[[][][]]')
                const cart = await db.usercarts.findAll({ where: { stockId: { [db.Op.in]: ids }, orderFrom: id, orderTo: Number(ccc) } })
                // const totalCount = updatedStock.length
                updatedStockWithQuantity = updatedStock.map(stockItem => {
                    const cartItem = cart.find(c => c.stockId === stockItem.SId);
                    return {
                        ...stockItem,
                        quantity: cartItem ? cartItem.quantity : 0  // Add quantity if found, else 0
                    };
                });
            }
            const totalPage = Math.ceil(count / Limit)
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPage: totalPage,
                totalData: count,
                limit: Limit,
                apiData: { manufacturer, stocks: updatedStockWithQuantity.length > 0 ? updatedStockWithQuantity : updatedStock }
            }
        } catch (error) {
            console.log('getStocksByManufacturer service error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    // async po_page_data(data) {
    //     try {
    //         const id = Number(data.id)
    //         // console.log(id)
    //         const result = await db.orders.findOne({
    //             attributes: [
    //                 [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"], // Total orders
    //                 [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Received', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
    //                 [db.sequelize.fn("COUNT", db.sequelize.literal("CASE WHEN balance > 0 THEN 1 ELSE NULL END")), "totalDueAmtOrders"], // Count of due amount orders
    //                 [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN balance > 0 THEN balance ELSE 0 END")), "totalDueAmount"] // Sum of due amounts
    //             ],
    //             where: { orderFrom: id },
    //             raw: true
    //         });

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             apiData: {
    //                 "totalOrders": result.totalOrders,
    //                 "completedOrders": Number(result.completedOrders),
    //                 "pendingOrders": Number(result.totalOrders) - Number(result.completedOrders),
    //                 "totalDueAmtOrders": result.totalDueAmtOrders,
    //                 "totalDueAmount": result.totalDueAmount
    //             }
    //         }
    //     } catch (error) {
    //         console.log('po_page_data service error:', error.message)
    //     }
    // }

    async po_page_data(data) {
        try {
            const { id } = data;
            const userId = Number(id);

            // Parallelizing queries for better performance
            const [orderStats, retailerCounts, pendingAuthorizations] = await Promise.all([
                db.orders.findOne({
                    attributes: [
                        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"], // Total orders
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Received', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
                        [db.sequelize.fn("COUNT", db.sequelize.literal("CASE WHEN balance > 0 THEN 1 ELSE NULL END")), "totalDueAmtOrders"], // Count of due amount orders
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN balance > 0 THEN balance ELSE 0 END")), "totalDueAmount"] // Sum of due amounts
                    ],
                    where: { orderFrom: userId },
                    raw: true,
                }),

                // Fetch total retailers grouped by companyType
                db.authorizations.findAll({
                    attributes: [
                        "retailers.companyType",
                        [db.sequelize.fn("COUNT", db.sequelize.col("authorizations.authorizedId")), "count"],
                    ],
                    where: { authorizedBy: userId, status: "Approved" },
                    include: [
                        {
                            model: db.retailers,
                            as: "retailers", // Ensure alias matches the association
                            attributes: ["companyType"],
                        },
                    ],
                    group: ["retailers.companyType"],
                    raw: true,
                }),

                // Count pending authorizations
                db.authorizations.count({ where: { authorizedBy: userId, status: "Pending" } }),
            ]);


            // Extract retailer counts based on companyType
            const totalRetailersCount = retailerCounts.length > 0 ? Number(retailerCounts[0]?.totalRetailers) || 0 : 0;

            return {
                status: 200,
                message: "Data fetched successfully",
                data: {
                    totalOrders: Number(orderStats?.totalOrders) || 0,
                    completedOrders: Number(orderStats?.completedOrders) || 0,
                    pendingOrders: (Number(orderStats?.totalOrders) || 0) - (Number(orderStats?.completedOrders) || 0),
                    totalDueAmtOrders: orderStats?.totalDueAmtOrders ? Number(orderStats.totalDueAmtOrders.toFixed(2)) : 0.0,
                    totalDueAmount: orderStats?.totalDueAmount ? Number(orderStats.totalDueAmount.toFixed(2)) : 0.0,
                    totalRetailersCount: totalRetailersCount,
                    pendingAuthorizations,
                },
            };
        } catch (error) {
            console.error("po_page_data service error:", error.message);
            return {
                status: 500,
                message: "Internal server error",
            };
        }
    }

    async so_page_data(data) {
        try {
            const id = Number(data.id)
            const result = await db.orders.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"], // Total orders
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Received', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
                    [db.sequelize.fn("COUNT", db.sequelize.literal("CASE WHEN balance > 0 THEN 1 ELSE NULL END")), "totalDueAmtOrders"], // Count of due amount orders
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN balance > 0 THEN balance ELSE 0 END")), "totalDueAmount"] // Sum of due amounts
                ],
                where: { orderTo: id },
                raw: true
            });

            const users = await db.authorizations.findOne({
                attributes: [
                    [db.sequelize.fn("COUNT", db.sequelize.col("authorizations.id")), "totalApproved"], // Total Approved authorizations
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN authorizedUser.userType = 'Distributor' THEN 1 ELSE 0 END")), "totalDistributors"], // Count of Distributors
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN authorizedUser.userType = 'Retailer' THEN 1 ELSE 0 END")), "totalRetailers"], // Count of Retailers
                    [
                        db.sequelize.literal(`(
                            SELECT COUNT(*) 
                            FROM authorizations AS pendingAuth 
                            WHERE pendingAuth.authorizedBy = ${id} 
                            AND pendingAuth.status = 'Pending'
                        )`),
                        "totalPending"
                    ]
                ],
                include: [
                    {
                        model: db.users,
                        as: "authorizedUser", // Use the correct alias
                        attributes: [], // No need to fetch user attributes
                        required: true // Ensures only matching users are counted
                    }
                ],
                where: {
                    authorizedBy: id, // Replace with actual ID
                    status: "Approved"
                },
                raw: true
            });



            return {
                status: message.code200,
                message: message.message200,
                apiData: {
                    "totalOrders": result.totalOrders,
                    "completedOrders": Number(result.completedOrders),
                    "pendingOrders": Number(result.totalOrders) - Number(result.completedOrders),
                    "totalDueAmtOrders": result.totalDueAmtOrders,
                    "totalDueAmount": result.totalDueAmount,
                    "totalDistribuor": users.totalDistributors || 0,
                    "totalRetailer": users.totalRetailers || 0,
                    "totalPending": users.totalPending || 0
                }
            }
        } catch (error) {
            console.log('so_page_data service error:', error.message)
        }
    }
    async distributor_profile(data) {
        try {
            console.log(data)
            const { id } = data

            const [aa] = await db.sequelize.query(
                `SELECT documentName FROM documentcategory WHERE category = 'Distributor'`
            );
            const document = await db.documentCategory.findAll({
                attributes: ['id', 'documentName'],
                include: [
                    {
                        model: db.documents,
                        as: "documnets",
                        attributes: ['image', "status", 'updatedAt'],
                        where: {
                            userId: Number(id)
                        },
                        required: false,
                    },
                ],
                where: { category: "Distributor" }
            })
            let columns = [];
            if (aa) {
                columns = aa.map((item) => item.documentName);
            }

            const documentColumns = columns.length > 0 ? columns.map(col => `doc.\`${col}\``).join(", ") : '';

            const documentColumnsQuery = documentColumns ? `, ${documentColumns}` : '';

            const query = `
            SELECT 
              mn.companyName, 
        mn.ownerName, 
        mn.profilePic, 
        mn.createdAt, 
        mn.updatedAt, 
        mn.address, 
        mn.phone, 
        mn.email, 
        mn.GST as gst, 
        mn.distributorId, 
        mn.wholeSaleDrugLicence,
        mn.FSSAI,
        mn.PAN as pan, 
        mn.CIN as cin,
        mn.type,
              us.*, 
              ad.*
            FROM crm_db.distributors_new AS mn
            LEFT JOIN crm_db.users AS us 
              ON mn.distributorId = us.id
            LEFT JOIN crm_db.address AS ad
              ON mn.distributorId = ad.userId
            WHERE mn.distributorId = ${id};
          `;

            const [dataa] = await db.sequelize.query(query);
            const transformedData = {};
            // console.log(dataa)
            dataa.forEach((row) => {
                const distributorId = row.distributorId;

                if (!transformedData[distributorId]) {
                    transformedData[distributorId] = {
                        distributor: {
                            companyName: row.companyName,
                            ownerName: row.ownerName,
                            logo: row.profilePic,
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt,
                            address: row.address,
                            phone: row.phone,
                            email: row.email,
                            GST: row.gst,
                            wholeSaleDrugLicence: row.wholeSaleDrugLicence,
                            FSSAI: row.FSSAI,
                            distributorId: row.distributorId,
                            PAN: row.pan,
                            CIN: row.cin,
                            type: row.type,
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
                    transformedData[distributorId].addresses[row.addressType] = {
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

                transformedData[distributorId].documents = document
                // Add documents (only specific columns that were dynamically added)
                // columns.forEach((col) => {
                //   if (row[col] !== undefined) {
                //     transformedData[manufacturerId].documents[col] = row[col];
                //   }
                // });
            });

            // Convert transformedData object to an array
            const result = Object.values(transformedData);
            return {
                status: message.code200,
                message: message.message200,
                apiData: result[0]
            }
        } catch (error) {
            console.log('distributor_profile service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async update_distributor(data) {
    //     let transaction;
    //     console.log(data)
    //     try {
    //         const { distributorId, profilePic, companyName, companyType, ownerName, email, phone, address, GST, wholeSaleDrugLicence, FSSAI, PAN, CIN, businessAdd, billingAdd, documents, manufactureres } = data;

    //         if (!distributorId) {
    //             return {
    //                 status: message.code400,
    //                 message: "Distributor ID is required",
    //             }
    //         }
    //         transaction = await db.sequelize.transaction({ timeout: 30000 });
    //         //   console.log(';;;;')
    //         const distributor = await db.sequelize.query(
    //             `SELECT 
    //                  *
    //                FROM distributors_new
    //                WHERE distributorId = :distributorId`,
    //             {
    //                 replacements: { distributorId },
    //                 type: db.Sequelize.QueryTypes.SELECT, // Ensures the query returns plain data
    //                 transaction, // Pass the transaction if needed
    //             }
    //         );
    //         console.log('gffxchbjknk', distributor)
    //         // Ensure you get a single object, not an array
    //         //   const manufacturerDetails = distributor.length > 0 ? distributor[0] : null;

    //         if (!distributor) {
    //             return {
    //                 status: 404,
    //                 message: "Manufacturer not found",
    //             }
    //         }

    //         // const authhh = manufactureres?.map((item)=>{
    //         //     return {
    //         //         authorizedBy:Number(item),
    //         //         authorizedId:Number(distributorId),
    //         //         status:'Pending'
    //         //     }
    //         // })

    //         // await db.authorizations.bulkCreate(authhh)
    //         const authhh = manufactureres.map((item) => ({
    //             authorizedBy: Number(item),
    //             authorizedId: Number(distributorId),
    //             status: "Pending",
    //         }));

    //         // Find existing records where status is 'Not Send'
    //         const existingRecords = await db.authorizations.findAll({
    //             where: {
    //                 authorizedBy: authhh.map((a) => a.authorizedBy),
    //                 authorizedId: authhh.map((a) => a.authorizedId),
    //                 status: { [db.Op.in]: ['Not Send', 'Pending'] },
    //             },
    //             raw: true,
    //         });

    //         // Get the records that need updates
    //         const toUpdate = existingRecords.map((rec) => rec.id);

    //         // Update existing records
    //         if (toUpdate.length > 0) {
    //             await db.authorizations.update(
    //                 { status: "Pending" },
    //                 { where: { id: toUpdate } }
    //             );
    //         }

    //         // Filter out records that already exist to avoid duplicate inserts
    //         const existingKeys = new Set(existingRecords.map((rec) => `${rec.authorizedBy}-${rec.authorizedId}`));
    //         const newRecords = authhh.filter((a) => !existingKeys.has(`${a.authorizedBy}-${a.authorizedId}`));

    //         // Insert new records if any
    //         if (newRecords.length > 0) {
    //             await db.authorizations.bulkCreate(newRecords);
    //         }

    //         // Update manufacturer details
    //         //   await db.distributors.update(
    //         //     {
    //         //       profilePic: profilePic ?? db.sequelize.col("profilePic"),
    //         //       companyName: companyName ?? db.sequelize.col("companyName"),
    //         //       ownerName: ownerName ?? db.sequelize.col("ownerName"),
    //         //     //   email: email ?? db.sequelize.col("email"),
    //         //       phone: phone ?? db.sequelize.col("phone"),
    //         //       address: address ?? db.sequelize.col("address"),
    //         //       GST: GST ?? db.sequelize.col("GST"),
    //         //       wholeSaleDrugLicence: wholeSaleDrugLicence ?? db.sequelize.col("wholeSaleDrugLicence"),
    //         //       PAN: PAN ?? db.sequelize.col("PAN"),
    //         //       FSSAI: FSSAI ?? db.sequelize.col("FSSAI"),
    //         //       CIN: CIN ?? db.sequelize.col("CIN"),
    //         //       updatedAt: db.sequelize.literal("NOW()"), // Update timestamp
    //         //     },
    //         //     {
    //         //       where: { distributorId },
    //         //       transaction, // Pass the transaction here
    //         //     }
    //         //   )
    //         await db.sequelize.query(
    //             `UPDATE distributors_new 
    //                SET 
    //                   profilePic = COALESCE(:profilePic, profilePic),
    //                   companyName = COALESCE(:companyName, companyName),
    //                   companyType = COALESCE(:companyType, companyType),
    //                   ownerName = COALESCE(:ownerName, ownerName),
    //                   email = COALESCE(:email, email),
    //                   phone = COALESCE(:phone, phone),
    //                   address = COALESCE(:address, address),
    //                   GST = COALESCE(:GST, GST),
    //                   wholeSaleDrugLicence = COALESCE(:wholeSaleDrugLicence, wholeSaleDrugLicence),
    //                   PAN = COALESCE(:PAN, PAN),
    //                   FSSAI = COALESCE(:FSSAI, FSSAI),
    //                   CIN = COALESCE(:CIN, CIN)
    //                WHERE distributorId = :distributorId`,
    //             {
    //                 replacements: {
    //                     profilePic,
    //                     companyName,
    //                     companyType,
    //                     ownerName,
    //                     email,
    //                     phone,
    //                     address,
    //                     GST,
    //                     wholeSaleDrugLicence,
    //                     PAN,
    //                     FSSAI,
    //                     CIN,
    //                     distributorId
    //                 },
    //                 transaction, // Pass the transaction here
    //             }
    //         );

    //         console.log('[[[[[')
    //         const existingAddresses = await db.address.findAll({
    //             where: { userId: distributorId },
    //         });

    //         if (existingAddresses.length) {
    //             // Update existing addresses
    //             await Promise.all(
    //                 existingAddresses.map(async (existingAddress) => {
    //                     const updateData =
    //                         existingAddress.addressType === "Business" ? businessAdd : billingAdd;
    //                     await existingAddress.update(updateData, { transaction });
    //                 })
    //             );
    //         } else {
    //             // Insert new addresses
    //             let dataToInsert = [
    //                 { ...businessAdd, userId: distributorId, addressType: "Business" },
    //                 { ...billingAdd, userId: distributorId, addressType: "Billing" },
    //             ];
    //             await db.address.bulkCreate(dataToInsert, { transaction });
    //         }

    //         const documentsData = documents.map((doc) => ({
    //             categoryId: doc.id,
    //             image: doc.image,
    //             status: 'Verified',
    //             userId: Number(distributorId)
    //         }));

    //         await db.documents.bulkCreate(documentsData, {
    //             updateOnDuplicate: ["image", 'status'],
    //             conflictFields: ["categoryId", "userId"]
    //         });

    //         // Fetch manufacturer names for the provided manufacturer IDs
    //         const manufacturerNames = await db.manufacturers.findAll({
    //             where: { manufacturerId: manufactureres },
    //             attributes: ['manufacturerId', 'companyName'],
    //             raw: true
    //         });

    //         // Format the response to include manufacturer names
    //         const manufacturerList = manufacturerNames.map(manu => ({
    //             manufacturerId: manu.manufacturerId,
    //             companyName: manu.companyName
    //         }));
    //         console.log("Distributor details updated successfully");
    //         return {
    //             status: message.code200,
    //             message: "Distributor details updated successfully",
    //             manufacturers: manufacturerList,
    //             documents: documentsData
    //         };
    //     } catch (error) {
    //         console.log('update_distributor service error:', error.message)
    //         return {
    //             status: message.code500,
    //             message: error.message
    //         }
    //     }
    // }

    async update_distributor(data) {
        let transaction;
        console.log(data);
        try {
            const { distributorId, profilePic, companyName, companyType, ownerName, email, phone, address, GST, wholeSaleDrugLicence, FSSAI, PAN, CIN, businessAdd, billingAdd, documents, manufactureres } = data;

            if (!distributorId) {
                return {
                    status: message.code400,
                    message: "Distributor ID is required",
                };
            }
            transaction = await db.sequelize.transaction({ timeout: 30000 });

            // Fetch distributor
            const distributor = await db.distributors.findOne({
                where: { distributorId },
                transaction
            });

            console.log('Fetched distributor:', distributor);

            if (!distributor) {
                return {
                    status: 404,
                    message: "Distributor not found",
                };
            }

            //auhtorizations update
            const authhh = manufactureres.map((item) => ({
                authorizedBy: Number(item),
                authorizedId: Number(distributorId),
                status: "Pending",
            }));

            const existingRecords = await db.authorizations.findAll({
                where: {
                    authorizedBy: authhh.map((a) => a.authorizedBy),
                    authorizedId: authhh.map((a) => a.authorizedId),
                    status: { [db.Sequelize.Op.in]: ['Not Send', 'Pending'] },
                },
                raw: true,
                transaction
            });

            const toUpdate = existingRecords.map((rec) => rec.id);
            if (toUpdate.length > 0) {
                await db.authorizations.update(
                    { status: "Pending" },
                    { where: { id: toUpdate }, transaction }
                );
            }

            const existingKeys = new Set(existingRecords.map((rec) => `${rec.authorizedBy}-${rec.authorizedId}`));
            const newRecords = authhh.filter((a) => !existingKeys.has(`${a.authorizedBy}-${a.authorizedId}`));
            if (newRecords.length > 0) {
                await db.authorizations.bulkCreate(newRecords, { transaction });
            }

            // distributor table update
            await db.distributors.update(
                {
                    profilePic,
                    companyName,
                    companyType,
                    ownerName,
                    email,
                    phone,
                    address,
                    GST,
                    wholeSaleDrugLicence,
                    PAN,
                    FSSAI,
                    CIN,
                    updatedAt: db.sequelize.literal("NOW()")
                },
                { where: { distributorId }, transaction }
            );

            console.log("Distributor updated successfully");

            // address updates
            const existingAddresses = await db.address.findAll({ where: { userId: distributorId }, transaction });
            if (existingAddresses.length) {
                await Promise.all(existingAddresses.map(async (existingAddress) => {
                    const updateData =
                        existingAddress.addressType === "Business" ? businessAdd : billingAdd;
                    await existingAddress.update(updateData, { transaction });
                }));
            } else {
                const dataToInsert = [
                    { ...businessAdd, userId: distributorId, addressType: "Business" },
                    { ...billingAdd, userId: distributorId, addressType: "Billing" },
                ];
                await db.address.bulkCreate(dataToInsert, { transaction });
            }

            // documents update
            const documentsData = documents.map((doc) => ({
                categoryId: doc.id,
                image: doc.image,
                status: 'Verified',
                userId: Number(distributorId)
            }));

            await db.documents.bulkCreate(documentsData, {
                updateOnDuplicate: ["image", "status"],
                transaction
            });

            //Getting manufcturerName that is passed in the payLoad
            const manufacturerNames = await db.manufacturers.findAll({
                where: { manufacturerId: manufactureres },
                attributes: ['manufacturerId', 'companyName'],
                raw: true,
                transaction
            });

            const manufacturerList = manufacturerNames.map(manu => ({
                manufacturerId: manu.manufacturerId,
                companyName: manu.companyName
            }));

            await transaction.commit();
            console.log("Distributor details updated successfully");
            return {
                status: message.code200,
                message: "Distributor details updated successfully",
                manufacturers: manufacturerList,
                documents: documentsData
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('update_distributor service error:', error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async check_profile(data) {
        try {
            const { id } = data
            const check = await db.authorizations.findAll({ where: { authorizedId: Number(id) } })
            if (check.length > 0) {
                return {
                    status: message.code200,
                    message: message.message200
                }
            } else {
                return {
                    status: message.code400,
                    message: message.message400
                }
            }
        } catch (error) {
            console.log('check_profile error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    async get_distributor_stocks(data) {
        try {
            const { id, entityId, page, limit, expStatus, search, stockStatus } = data;
            // console.log(data)
            //   const userData = await db.users.findOne({ where: { id: Number(id) } })
            //   const tableName = userData?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
            let Page = page || 1;
            let Limit = limit || 10;
            const nearToExpDate = Number(process.env.lowStockDays)
            // console.log(nearToExpDate)
            let whereCondition = { organisationId: Number(id) };
            if (entityId) {
                whereCondition.entityId = Number(entityId);
            }

            // Handle expiration status filter
            if (expStatus) {
                const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format

                if (expStatus === "expired") {
                    whereCondition.ExpDate = { [db.Sequelize.Op.lt]: today }; // Expired (before today)
                } else if (expStatus === "nearToExp") {
                    const nearToExpDate = new Date();
                    nearToExpDate.setDate(nearToExpDate.getDate() + nearToExpDate);
                    whereCondition.ExpDate = {
                        [db.Sequelize.Op.between]: [today, nearToExpDate.toISOString().split("T")[0]],
                    }; // Between today and 90 days from now
                } else if (expStatus === "upToDate") {
                    const upToDateThreshold = new Date();
                    upToDateThreshold.setDate(upToDateThreshold.getDate() + Number(nearToExpDate));
                    whereCondition.ExpDate = { [db.Sequelize.Op.gt]: upToDateThreshold.toISOString().split("T")[0] }; // More than 90 days from today
                }
            }

            let skip = (Page - 1) * Number(Limit);
            const { rows: stocks, count } = await db.stocks.findAndCountAll({
                // attributes:[]
                where: whereCondition,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED", "manufacturerId"]
                    }
                ]
            })
            return {
                status: message.code200,
                message: message.message200,
                totalData: count,
                totalPage: Math.ceil(count / Limit),
                currentPage: Page,
                apiData: stocks
            }

            //   const { rows: stocks, count } = await db.products.findAndCountAll({
            //     attributes: [
            //       "PId",
            //       "PCode",
            //       "PName",
            //       "PackagingDetails",
            //       "SaltComposition",
            //       "LOCKED",
            //       "manufacturerId"
            //     ],
            //     include: [
            //       {
            //         model: db.stocks,
            //         as: "stocks", // Adjust alias as per your association
            //         required: false, // LEFT JOIN: include products even if stock is not available
            //         where: whereCondition
            //       },
            //     ],
            //     where: {
            //       manufacturerId: id,
            //       ...(search
            //         ? {
            //           [Op.or]: [
            //             { PCode: { [Op.like]: `%${search}%` } },
            //             { PName: { [Op.like]: `%${search}%` } },
            //             { SaltComposition: { [Op.like]: `%${search}%` } },
            //           ],
            //         }
            //         : {}),
            //     },
            //     offset: skip,
            //     limit: Number(Limit),
            //     subQuery: false,
            //     // raw: true,
            //     // nest: true,
            //   })

        } catch (error) {
            console.log('get_distributor_stocks service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async update_distributorType(data) {
    //     let transaction;
    //     try {
    //         const { userId } = data;

    //         if (!userId) {
    //             return {
    //                 status: message.code400,
    //                 message: "Distributor ID is required",
    //             };
    //         }

    //         transaction = await db.sequelize.transaction();

    //         // Check if the distributor exists
    //         const distributor = await Distributors.findOne({
    //             where: { distributorId: userId },
    //             transaction
    //         });

    //         if (!distributor) {
    //             await transaction.rollback();
    //             return {
    //                 status: message.code404,
    //                 message: "Distributor not found",
    //             };
    //         }

    //         // Update distributor type to CNF
    //         await Distributors.update(
    //             { type: "CNF" },
    //             { where: { distributorId: userId }, transaction }
    //         );

    //         await transaction.commit();

    //         return {
    //             status: message.code200,
    //             message: "Distributor type updated to CNF successfully",
    //         };
    //     } catch (error) {
    //         if (transaction) await transaction.rollback();
    //         console.error("update_distributorType error:", error.message);
    //         return {
    //             status: message.code500,
    //             message: error.message,
    //         };
    //     }
    // }

    async update_distributorType(data, userIdFromToken) {
        let transaction;
        try {
            const { type } = data; // Extract type from the request body

            if (type === undefined) {
                return {
                    status: message.code400,
                    message: "Type is required",
                };
            }

            transaction = await db.sequelize.transaction();

            // Check if the distributor exists
            const distributor = await Distributors.findOne({
                where: { distributorId: userIdFromToken },
                transaction
            });

            if (!distributor) {
                await transaction.rollback();
                return {
                    status: message.code404,
                    message: "Distributor not found",
                };
            }

            // Determine the new type based on input
            const newType = type == true ? "CNF" : "Distributor";

            // Update distributor type
            await Distributors.update(
                { type: newType },
                { where: { distributorId: userIdFromToken }, transaction }
            );

            await transaction.commit();

            return {
                status: message.code200,
                message: `Distributor type updated to ${newType} successfully`,
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.error("update_distributorType error:", error.message);
            return {
                status: message.code500,
                message: error.message,
            };
        }
    }

    //Employee Management..........................................................

    async create_role(data, userIdFromToken) {
        try {
            if (!data.roleName) {
                throw new Error("roleName is required");
            }

            const roleCode = data.roleName.toUpperCase().replace(/\s+/g, "_");


            const existingRole = await db.roles.findOne({
                where: { roleCode: roleCode, ownerId: userIdFromToken }
            });

            if (existingRole) {
                throw new Error("Role already exists for this owner.");
            }

            const newRole = await db.roles.create({
                roleCode: roleCode,
                roleName: data.roleName,
                description: data.description || null,
                // priority: data.priority || 1, 
                status: data.status || "Active",
                ownerId: userIdFromToken,
            });

            return { status: "success", message: "Role created successfully", data: newRole };
        } catch (error) {
            console.error("Error creating role:", error.message);
            throw new Error(error.message);
        }
    }

    async get_roles(data) {
        try {
            // Extract page, limit, and roleName from input data
            const { page = 1, limit, roleName } = data;
            // console.log(page,limit,';;;;;;;;;;;;;;;;;;;;;;;')
            // Default limit if not provided, and parse the page and limit values
            const Limit = Number(limit) || 10
            const Page = Number(page) || 1;
            const offset = (Page - 1) * Limit;

            // Initialize the filter condition
            let whereCondition = {};

            // Apply roleName filter if provided (case-insensitive search)
            if (roleName && roleName.trim() !== "") {
                whereCondition.roleName = { [db.Sequelize.Op.like]: `%${roleName}%` };
            }

            // Fetch roles with pagination, including the filter
            const { rows: roles, count: totalRoles } = await db.roles.findAndCountAll({
                where: whereCondition,
                attributes: [
                    'id',
                    'roleName',
                    'createdAt',
                    'status'
                ],
                order: [['createdAt', 'DESC']],
                limit: Limit,
                offset,
            });

            // Calculate total pages based on the count of roles and the limit per page
            const totalPages = Math.ceil(totalRoles / Limit);
            // console.log("Limit.......", Limit);
            // Return the paginated results along with metadata
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalPages: totalPages,
                totalRoles: totalRoles,
                limit: Limit,
                apiData: roles
            };

        } catch (error) {
            console.error("Error fetching roles:", error.message);
            return {
                status: message.code500,
                message: message.message500
            };
        }
    }

    async update_roles(id, data) {
        try {
            const { newRoleName, status } = data;

            if (!newRoleName) {
                throw new Error("New role name is required.");
            }

            // Generate the roleCode by transforming the roleName:
            const roleCode = newRoleName
                .toUpperCase()              // Capitalize all characters
                .replace(/\s+/g, "_");      // Replace spaces with underscores

            // Find role by ID
            const role = await db.roles.findOne({ where: { id } });

            if (!role) {
                return null; // Role not found
            }

            // Update the role with the new roleName and generated roleCode
            await db.roles.update(
                { roleName: newRoleName, roleCode: roleCode, status: status },
                { where: { id } }
            );

            return { id, newRoleName, roleCode, status }; // Return updated role details

        } catch (error) {
            throw new Error(error.message);
        }
    }

    async delete_role(roleId) {
        try {
            if (!roleId) {
                throw new Error("roleId is required");
            }

            // Attempt to delete the role with the specified roleId
            const deletedCount = await db.roles.destroy({
                where: { id: roleId }
            });

            if (deletedCount === 0) {
                throw new Error("Role not found.");
            }

        } catch (error) {
            console.error("Error deleting role:", error.message);
            throw new Error(error.message);
        }
    }

    async addModuleConfig({ moduleName, category, icon, url, menuType, parentModuleName = null }) {
        try {
            // Generate moduleCode by converting moduleName to uppercase and replacing spaces with underscores
            const moduleCode = moduleName.toUpperCase().replace(/\s+/g, "_");

            let parentMenuId = null;

            // Determine parentMenuId based on menuType
            if (menuType === 'Sub' || menuType === 'Component') {
                if (!parentModuleName) {
                    throw new Error(`Parent module name is required for menuType '${menuType}'.`);
                }

                // Determine the expected parent menuType
                const expectedParentMenuType = menuType === 'Sub' ? 'Main' : 'Sub';

                // Find the parent module based on the provided parentModuleName and expected parent menuType
                const parentModule = await ModuleConfig.findOne({
                    where: {
                        moduleName: parentModuleName,
                        menuType: expectedParentMenuType
                    }
                });

                if (!parentModule) {
                    throw new Error(`Parent module '${parentModuleName}' with menuType '${expectedParentMenuType}' not found.`);
                }

                parentMenuId = parentModule.moduleConfigId;
            }

            // Create the new module configuration
            const newModule = await ModuleConfig.create({
                moduleName,
                moduleCode,
                category,
                icon,
                url,
                menuType,
                parentMenuId
            });

            return newModule;
        } catch (error) {
            console.error(`Error adding module: ${error.message}`);
            throw error;
        }
    }

    async createModuleConfig(data) {
        try {
            const { moduleName, category, icon, url, menuType } = data;

            // Convert moduleName to moduleCode (uppercase & replace spaces with '_')
            const moduleCode = moduleName.toUpperCase().replace(/\s+/g, "_");

            let parentMenuId = 0; // Default for 'Main'

            if (menuType === "Sub") {
                // Get the last inserted 'Main' module's ID
                const mainModule = await db.moduleconfigs.findOne({
                    where: { menuType: "Main" },
                    order: [["moduleConfigId", "DESC"]], // Get the latest Main module
                });

                if (mainModule) parentMenuId = mainModule.moduleConfigId;
            }
            else if (menuType === "Component") {
                // Get the last inserted 'Sub' module's ID
                const subModule = await db.moduleconfigs.findOne({
                    where: { menuType: "Sub" },
                    order: [["moduleConfigId", "DESC"]], // Get the latest Sub module
                });

                if (subModule) parentMenuId = subModule.moduleConfigId;
            }

            // Insert into moduleconfigs table
            const newModule = await db.moduleconfigs.create({
                moduleName,
                moduleCode,
                category,
                icon,
                url,
                menuType,
                parentMenuId,
            });

            return {
                status: 201,
                message: "Module created successfully",
                data: newModule,
            };
        } catch (error) {
            return {
                status: 500,
                message: error.message,
            };
        }
    }

    // async getAllModules() {
    //     try {
    //         const modules = await db.moduleconfigs.findAll({ raw: true });

    //         // Organize modules into a nested structure
    //         const moduleTree = {};

    //         modules.forEach(module => {
    //             if (module.menuType === 'Main') {
    //                 moduleTree[module.moduleName] = { id: module.moduleConfigId, subModules: {} };
    //             }
    //         });

    //         modules.forEach(module => {
    //             if (module.menuType === 'Sub') {
    //                 const mainModule = Object.values(moduleTree).find(m => m.id === module.parentMenuId);
    //                 if (mainModule) {
    //                     mainModule.subModules[module.moduleName] = { id: module.moduleConfigId, components: [] };
    //                 }
    //             }
    //         });

    //         modules.forEach(module => {
    //             if (module.menuType === 'Component') {
    //                 Object.values(moduleTree).forEach(mainModule => {
    //                     Object.values(mainModule.subModules).forEach(subModule => {
    //                         if (subModule.id === module.parentMenuId) {
    //                             subModule.components.push({
    //                                 id: module.moduleConfigId,
    //                                 name: module.moduleName
    //                             });
    //                         }
    //                     });
    //                 });
    //             }
    //         });

    //         return moduleTree;
    //     } catch (error) {
    //         console.error("Error fetching module configurations:", error);
    //         throw error;
    //     }
    // }

    async getAllModules() {
        try {
            const modules = await db.moduleconfigs.findAll({ raw: true });

            // Organize modules into a nested structure
            const moduleTree = [];

            // Process Main Modules
            modules.forEach(module => {
                if (module.menuType === 'Main') {
                    moduleTree.push({
                        id: module.moduleConfigId,
                        name: module.moduleName,
                        subModules: []
                    });
                }
            });

            // Process Sub Modules
            modules.forEach(module => {
                if (module.menuType === 'Sub') {
                    const mainModule = moduleTree.find(m => m.id === module.parentMenuId);
                    if (mainModule) {
                        mainModule.subModules.push({
                            id: module.moduleConfigId,
                            name: module.moduleName,
                            components: []
                        });
                    }
                }
            });

            // Process Components
            modules.forEach(module => {
                if (module.menuType === 'Component') {
                    moduleTree.forEach(mainModule => {
                        mainModule.subModules.forEach(subModule => {
                            if (subModule.id === module.parentMenuId) {
                                subModule.components.push({
                                    id: module.moduleConfigId,
                                    name: module.moduleName
                                });
                            }
                        });
                    });
                }
            });

            return {
                status: 200,
                message: "Success",
                data: moduleTree
            };
        } catch (error) {
            console.error("Error fetching module configurations:", error);
            return {
                status: 500,
                message: "Error fetching module configurations",
                error: error.message
            };
        }
    }



}

module.exports = new DistributorService(db);
