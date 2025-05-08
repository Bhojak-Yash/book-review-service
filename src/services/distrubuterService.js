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

const formatSize = (size) => {
    let bytes = Number(size);
    if (isNaN(bytes)) return null;

    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
};

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
                    status: "Active",
                    email: userName
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

    // async updateDistributors(data) {
    //     try {
    //         const { distributorid, logo, companyName, ownerName, email, phone, address, GST, licence } = data;

    //         if (!distributorid) {
    //             return {
    //                 status: message.code400,
    //                 message: "Distributor ID is required",
    //             }
    //         }

    //         const distributor = await Distributors.findByPk(distributorid);

    //         if (!distributor) {
    //             return {
    //                 status: 404,
    //                 message: "Distributor not found",
    //             }
    //         }

    //         // Update manufacturer details
    //         await distributor.update({
    //             logo: logo || distributor.logo,
    //             companyName: companyName || distributor.companyName,
    //             ownerName: ownerName || distributor.ownerName,
    //             email: email || distributor.email,
    //             phone: phone || distributor.phone,
    //             address: address || distributor.address,
    //             GST: GST || distributor.GST,
    //             licence: licence || distributor.licence,
    //         });

    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //         }
    //     } catch (error) {
    //         console.log("updateDistributor error:", error.message);
    //         return {
    //             status: message.code500,
    //             message: error.message,
    //         }
    //     }
    // }

    async getManufacturer(data) {
        try {
            const { id, search, type } = data;

            let checkUserType = ['Distributor', 'Manufacturer']
            if (type == 'cnf') {
                checkUserType = ['Distributor']
            } else if (type == 'manufacturer') {
                checkUserType = ['Manufacturer']
            }
            const whereCondition = {
                userType: { [db.Op.in]: checkUserType },
                [db.Op.or]: [
                    { '$disuser.distributorId$': { [db.Op.ne]: null } },
                    { '$manufacturer.manufacturerId$': { [db.Op.ne]: null } }
                ]
            }
            if (id) {
                whereCondition.id = { [db.Op.ne]: Number(id) }
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
// console.log(whereCondition,'[[[[[[[[[',id)

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
                where: whereCondition
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
            console.log(id, ';;;;;;;;;;;;;;;;')
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
            console.log('ppppppp', manufacturer)
            // if (manufacturer.status != 'Approved' && manufacturer.status != 'Not Send') {
            //     return {
            //         status: 400,
            //         message: "Not authorized"
            //     }
            // }
            let tableName = db.manufacturerStocks
            let attr = ['SId', 'BatchNo', 'ExpDate', 'Scheme', 'MRP', 'PTS']
            if (type) {
                tableName = type === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
                attr = type === 'Manufacturer' ? ['SId', 'BatchNo', 'ExpDate', 'Scheme', 'MRP', 'PTS'] : ['SId', 'BatchNo', 'ExpDate', 'Scheme', 'MRP', 'PTS', 'PTR']
            }
            // console.log(whereStock, whereCondition)
            const { count, rows: stocks } = await tableName.findAndCountAll({
                attributes: attr,
                where: {
                    ...whereStock,
                    locked:false, 
                },
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
            console.log("................   `",type)
            let ids = []
            const updatedStock = await stocks?.map((item) => {
                ids.push(item.SId)
                if (manufacturer.status === 'Approved' || manufacturer.status === 'Not Send') {
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
                        // "PTS": item.PTS || 0,
                        "PTS": type === "CNF" ? item.PTR : item.PTS,
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
                        // "PTS": null,
                        "PTS":null,
                        "MRP": null,
                        "BatchNo": item.BatchNo,
                        "ExpDate": item.ExpDate,
                        "Scheme": null
                    }
                }
            })
            // console.log(updatedStock)
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
                authStatus: manufacturer?.status || 'Not Send',
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
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Inward', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
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
                    [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Inward', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
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
            // console.log(data)
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
                        attributes: ['documentId', 'image', "status", "imageSize", 'updatedAt'],
                        where: {
                            userId: Number(id),
                            isDeleted: false
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
        mn.companyType,
        mn.PAN as pan, 
        mn.CIN as cin,
        mn.type,
              us.*, 
              ad.*
            FROM distributors_new AS mn
            LEFT JOIN users AS us 
              ON mn.distributorId = us.id
            LEFT JOIN address AS ad
              ON mn.distributorId = ad.userId
            WHERE mn.distributorId = ${id};
          `;
            const authorizedBy = await db.authorizations.findAll({
                where: { authorizedId: Number(id) },
                attributes: ['authorizedId', 'authorizedBy'],
                include: [
                    {
                        model: db.manufacturers,
                        as: 'manufacturer',
                        attributes: ['manufacturerId', 'companyName']
                    },
                    {
                        model: db.distributors,
                        as: "distributor",
                        attributes: ['distributorId', 'companyName']
                    }
                ]
            })
            const [dataa] = await db.sequelize.query(query);
            // console.log(dataa)
            const transformedData = {};
            const auth = authorizedBy?.map((item) => {
                return {
                    authorizedBy: item.authorizedBy,
                    authorizedByUser: item?.manufacturer?.companyName || item?.distributor?.companyName || null,
                    type: item?.manufacturer?.companyName ? "Manufacturer" : 'CNF'
                }
            })
            // console.log(dataa)
            dataa.forEach((row) => {
                const distributorId = row.distributorId;
                // console.log(row)
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
                            email: row.userName,
                            GST: row.gst,
                            companyType: row.companyType,
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
                transformedData[distributorId].authorizedBy = auth
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

    async update_distributor(data) {
        let transaction;
        // console.log(data)
        try {
            const { distributorId, profilePic, companyName, companyType, ownerName, email, phone, address, GST, wholeSaleDrugLicence, FSSAI, PAN, CIN, businessAdd, billingAdd, documents, manufactureres } = data;

            if (!distributorId) {
                return {
                    status: message.code400,
                    message: "Distributor ID is required",
                }
            }
            transaction = await db.sequelize.transaction({ timeout: 30000 });
            //   console.log(';;;;')
            const distributor = await db.sequelize.query(
                `SELECT 
                     *
                   FROM distributors_new
                   WHERE distributorId = :distributorId`,
                {
                    replacements: { distributorId },
                    type: db.Sequelize.QueryTypes.SELECT,
                    transaction,
                }
            );
            // console.log('gffxchbjknk', distributor)

            if (!distributor) {
                return {
                    status: 404,
                    message: "Manufacturer not found",
                }
            }

            const authhh = manufactureres.map((item) => ({
                authorizedBy: Number(item),
                authorizedId: Number(distributorId),
                status: "Not Send",
            }));

            const existingRecords = await db.authorizations.findAll({
                where: {
                    [db.Op.or]: authhh.map(a => ({
                        authorizedBy: a.authorizedBy,
                        authorizedId: a.authorizedId,
                        // status: "Not Send",
                    }))
                },
                raw: true,
            });

            const existingSet = new Set(
                existingRecords.map(rec => `${rec.authorizedBy}_${rec.authorizedId}`)
            );

            const toCreate = authhh.filter(
                a => !existingSet.has(`${a.authorizedBy}_${a.authorizedId}`)
            );


            const existingKeys = new Set(existingRecords.map((rec) => `${rec.authorizedBy}-${rec.authorizedId}`));
            const newRecords = authhh.filter((a) => !existingKeys.has(`${a.authorizedBy}-${a.authorizedId}`));
            // console.log(newRecords,';;;;;;newrecored')

            if (newRecords.length > 0) {
                await db.authorizations.bulkCreate(newRecords);
            }

            await db.sequelize.query(
                `UPDATE distributors_new 
                   SET 
                      profilePic = COALESCE(:profilePic, profilePic),
                      companyName = COALESCE(:companyName, companyName),
                      companyType = COALESCE(:companyType, companyType),
                      ownerName = COALESCE(:ownerName, ownerName),
                      email = COALESCE(:email, email),
                      phone = COALESCE(:phone, phone),
                      address = COALESCE(:address, address),
                      GST = COALESCE(:GST, GST),
                      wholeSaleDrugLicence = COALESCE(:wholeSaleDrugLicence, wholeSaleDrugLicence),
                      PAN = COALESCE(:PAN, PAN),
                      FSSAI = COALESCE(:FSSAI, FSSAI),
                      CIN = COALESCE(:CIN, CIN)
                   WHERE distributorId = :distributorId`,
                {
                    replacements: {
                        profilePic,
                        companyName,
                        companyType,
                        ownerName,
                        email,
                        phone,
                        address,
                        GST,
                        wholeSaleDrugLicence,
                        // licence,
                        PAN,
                        FSSAI,
                        CIN,
                        distributorId
                    },
                    transaction,
                }
            );

            console.log('[[[[[')
            const existingAddresses = await db.address.findAll({
                where: { userId: distributorId },
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
                    { ...businessAdd, userId: distributorId, addressType: "Business" },
                    { ...billingAdd, userId: distributorId, addressType: "Billing" },
                ];
                await db.address.bulkCreate(dataToInsert, { transaction });
            }

            const documentsData = documents.map((doc) => ({
                categoryId: doc.id,
                image: doc.image,
                status: 'Verified',
                imageSize: doc?.imageSize ? formatSize(doc?.imageSize || 0) : "0KB",
                userId: Number(distributorId),
                isDeleted: false
            }));

            await db.documents.bulkCreate(documentsData, {
                updateOnDuplicate: ["image", 'status', 'imageSize', 'isDeleted'],
                conflictFields: ["categoryId", "userId", 'isDeleted']
            });

            // Fetch manufacturer names for the provided manufacturer IDs
            const manufacturerNames = await db.manufacturers.findAll({
                where: { manufacturerId: manufactureres },
                attributes: ['manufacturerId', 'companyName'],
                raw: true
            });

            // Format the response to include manufacturer names
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
            console.log('update_distributor service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async update_distributor(data) {
    //     let transaction;
    //     // console.log(data);
    //     try {
    //         const { distributorId, profilePic, companyName, companyType, ownerName, email, phone, address, GST, wholeSaleDrugLicence, FSSAI, PAN, CIN, businessAdd, billingAdd, documents, manufactureres } = data;

    //         if (!distributorId) {
    //             return {
    //                 status: message.code400,
    //                 message: "Distributor ID is required",
    //             };
    //         }
    //         transaction = await db.sequelize.transaction({ timeout: 30000 });

    //         // Fetch distributor
    //         const distributor = await db.distributors.findOne({
    //             where: { distributorId },
    //             transaction
    //         });

    //         // console.log('Fetched distributor:', distributor);

    //         if (!distributor) {
    //             return {
    //                 status: 404,
    //                 message: "Distributor not found",
    //             };
    //         }

    //         //auhtorizations update
    //         const authhh = manufactureres.map((item) => ({
    //             authorizedBy: Number(item),
    //             authorizedId: Number(distributorId),
    //             status: "Pending",
    //         }));
    //         // console.log(manufactureres,';;;;;',authhh)
    //         let existingRecords = []
    //         if (authhh.length > 0) {
    //             // console.log('[[[[[[[[[[[[[[[[[[[[[[[[[[')
    //             existingRecords = await db.authorizations.findAll({
    //                 where: {
    //                     authorizedBy: authhh.map((a) => a.authorizedBy),
    //                     authorizedId: authhh.map((a) => a.authorizedId),
    //                     status: { [db.Sequelize.Op.in]: ['Not Send', 'Pending'] },
    //                 },
    //                 raw: true,
    //                 transaction
    //             });
    //         }
    //         // console.log('ppppp')
    //         const toUpdate = existingRecords.map((rec) => rec.id);
    //         if (toUpdate.length > 0) {
    //             await db.authorizations.update(
    //                 { status: "Not Send" },
    //                 { where: { id: toUpdate }, transaction }
    //             );
    //         }

    //         const existingKeys = new Set(existingRecords.map((rec) => `${rec.authorizedBy}-${rec.authorizedId}`));
    //         const newRecords = authhh.filter((a) => !existingKeys.has(`${a.authorizedBy}-${a.authorizedId}`));
    //         if (newRecords.length > 0) {
    //             await db.authorizations.bulkCreate(newRecords, { transaction });
    //         }

    //         // distributor table update
    //         await db.distributors.update(
    //             {
    //                 profilePic,
    //                 companyName,
    //                 companyType,
    //                 ownerName,
    //                 email,
    //                 phone,
    //                 address,
    //                 GST,
    //                 wholeSaleDrugLicence,
    //                 PAN,
    //                 FSSAI,
    //                 CIN,
    //                 updatedAt: db.sequelize.literal("NOW()")
    //             },
    //             { where: { distributorId }, transaction }
    //         );

    //         console.log("Distributor updated successfully");

    //         // address updates
    //         const existingAddresses = await db.address.findAll({ where: { userId: distributorId }, transaction });
    //         if (existingAddresses.length) {
    //             await Promise.all(existingAddresses.map(async (existingAddress) => {
    //                 const updateData =
    //                     existingAddress.addressType === "Business" ? businessAdd : billingAdd;
    //                 await existingAddress.update(updateData, { transaction });
    //             }));
    //         } else {
    //             const dataToInsert = [
    //                 { ...businessAdd, userId: distributorId, addressType: "Business" },
    //                 { ...billingAdd, userId: distributorId, addressType: "Billing" },
    //             ];
    //             await db.address.bulkCreate(dataToInsert, { transaction });
    //         }

    //         // documents update
    //         const documentsData = documents.map((doc) => ({
    //             categoryId: doc.id,
    //             image: doc.image,
    //             status: 'Verified',
    //             userId: Number(distributorId),
    //             isDeleted: false
    //         }));

    //         await db.documents.bulkCreate(documentsData, {
    //             updateOnDuplicate: ["image", "status", 'isDeleted'],
    //             transaction
    //         });

    //         //Getting manufcturerName that is passed in the payLoad

    //         const manufacturerNames = await db.manufacturers.findAll({
    //             where: { manufacturerId: manufactureres },
    //             attributes: ['manufacturerId', 'companyName'],
    //             raw: true,
    //             transaction
    //         });

    //         const manufacturerList = manufacturerNames.map(manu => ({
    //             manufacturerId: manu.manufacturerId,
    //             companyName: manu.companyName
    //         }));

    //         await transaction.commit();
    //         console.log("Distributor details updated successfully");
    //         return {
    //             status: message.code200,
    //             message: "Distributor details updated successfully",
    //             manufacturers: manufacturerList,
    //             documents: documentsData
    //         };
    //     } catch (error) {
    //         if (transaction) await transaction.rollback();
    //         console.log('update_distributor service error:', error.message);
    //         return {
    //             status: message.code500,
    //             message: message.message500
    //         };
    //     }
    // }

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

    // async get_distributor_stocks(data) {
    //     try {
    //         const { id, entityId, page, limit, expStatus, search, stockStatus } = data;
    //         // console.log(data)
    //         //   const userData = await db.users.findOne({ where: { id: Number(id) } })
    //         //   const tableName = userData?.userType === 'Manufacturer' ? db.manufacturerStocks : db.stocks;
    //         let Page = page || 1;
    //         let Limit = limit || 10;
    //         const nearToExpDate = Number(process.env.lowStockDays)
    //         // console.log(nearToExpDate)
    //         let whereCondition = { organisationId: Number(id) };
    //         if (entityId) {
    //             whereCondition["$stocks.entityId"] = Number(entityId);
    //         }

    //         // Handle expiration status filter
    //         if (expStatus) {
    //             const today = new Date();
    //             const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    //             if (expStatus === "expired") {
    //                 whereCondition.ExpDate = {
    //                     [db.Sequelize.Op.lt]: todayStr, // Expired before today
    //                 };
    //             } else if (expStatus === "nearToExp") {
    //                 const nearToExpDate = new Date();
    //                 nearToExpDate.setDate(today.getDate() + 90); // Add 90 days
    //                 const nearToExpStr = nearToExpDate.toISOString().split("T")[0];

    //                 whereCondition.ExpDate = {
    //                     [db.Sequelize.Op.between]: [todayStr, nearToExpStr], // Between today and 90 days
    //                 };
    //             } else if (expStatus === "upToDate") {
    //                 const upToDateThreshold = new Date();
    //                 upToDateThreshold.setDate(today.getDate() + 90); // More than 90 days from today
    //                 const upToDateStr = upToDateThreshold.toISOString().split("T")[0];

    //                 whereCondition.ExpDate = {
    //                     [db.Sequelize.Op.gt]: upToDateStr,
    //                 };
    //             }
    //         }

    //         if (stockStatus) {
    //             const count = Number(process.env.aboutToEmpty)
    //             if (stockStatus === "outOfStock") {
    //                 whereCondition.stock = {
    //                     [db.Op.lte]:0
    //                 };
    //             } else if (stockStatus === "aboutEmpty") {
    //                 whereCondition.stock = {
    //                     [db.Op.gt]: 0,
    //                     [db.Op.lt]: count
    //                 };
    //             } else if (stockStatus === "upToDate") {
    //                 whereCondition.stock = {
    //                     [db.Op.gte]: count
    //                 };
    //             }
    //         }

    //         // if (search) {
    //         //     whereCondition[db.Op.or] = [
    //         //         { BatchNo: { [db.Op.like]: `%${search}%` } },
    //         //         { '$product.PName$': { [db.Op.like]: `%${search}%` } },
    //         //         { '$product.SaltComposition$': { [db.Op.like]: `%${search}%` } }
    //         //     ];
    //         // }
    //         if (search) {
    //             whereCondition[db.Op.or] = [
    //                 { BatchNo: { [db.Op.like]: `%${search}%` } },
    //                 { '$product.PName$': { [db.Op.like]: `%${search}%` } },
    //                 { '$product.SaltComposition$': { [db.Op.like]: `%${search}%` } }
    //             ];
    //         }



    //         let skip = (Page - 1) * Number(Limit);
    //          const { rows: stocks, count } = await db.stocks.findAndCountAll({
    //             // attributes:[]
    //             where: whereCondition,
    //             include: [
    //                 {
    //                     model: db.products,
    //                     as: 'product',
    //                     attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED", "manufacturerId"]
    //                 }
    //             ],
    //             offset: skip,
    //             Limit
    //         })
    //         return {
    //             status: message.code200,
    //             message: message.message200,
    //             totalData: count,
    //             totalPage: Math.ceil(count / Limit),
    //             currentPage: Page,
    //             apiData: stocks
    //         }

    //         //   const { rows: stocks, count } = await db.products.findAndCountAll({
    //         //     attributes: [
    //         //       "PId",
    //         //       "PCode",
    //         //       "PName",
    //         //       "PackagingDetails",
    //         //       "SaltComposition",
    //         //       "LOCKED",
    //         //       "manufacturerId"
    //         //     ],
    //         //     include: [
    //         //       {
    //         //         model: db.stocks,
    //         //         as: "stocks", // Adjust alias as per your association
    //         //         required: false, // LEFT JOIN: include products even if stock is not available
    //         //         where: whereCondition
    //         //       },
    //         //     ],
    //         //     where: {
    //         //       manufacturerId: id,
    //         //       ...(search
    //         //         ? {
    //         //           [Op.or]: [
    //         //             { PCode: { [Op.like]: `%${search}%` } },
    //         //             { PName: { [Op.like]: `%${search}%` } },
    //         //             { SaltComposition: { [Op.like]: `%${search}%` } },
    //         //           ],
    //         //         }
    //         //         : {}),
    //         //     },
    //         //     offset: skip,
    //         //     limit: Number(Limit),
    //         //     subQuery: false,
    //         //     // raw: true,
    //         //     // nest: true,
    //         //   })

    //     } catch (error) {
    //         console.log('get_distributor_stocks service error:', error.message)
    //         return {
    //             status: message.code500,
    //             message: error.message
    //         }
    //     }
    // }
    async get_distributor_stocks(data) {
        try {
            const { id, entityId, page, limit, expStatus, search, stockStatus } = data;

            const Page = Number(page) || 1;
            const Limit = Number(limit) || 10;
            const skip = (Page - 1) * Limit;

            const aboutToEmpty = Number(process.env.aboutToEmpty || 10);
            const lowStockDays = Number(process.env.lowStockDays || 90);

            // const authRecords = await db.authorizations.findAll({
            //     where: {
            //         authorizedId: Number(id),
            //         // status: { [db.Sequelize.Op.in]: ['Approved', 'Not Send'] },
            //     },
            //     attributes: ['authorizedBy'],
            // });

            // const authorizedBy = authRecords.map(a => a.authorizedBy);
            // if (authorizedBy.length === 0) return { status: 200, apiData: [], message: 'No authorized manufacturers found' };

            const stockFilters = {
                organisationId: Number(id),
            };
            if (entityId) stockFilters.entityId = Number(entityId);

            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            if (expStatus === "expired") {
                stockFilters.ExpDate = { [db.Sequelize.Op.lt]: todayStr };
            } else if (expStatus === "nearToExp") {
                const nearDate = new Date();
                nearDate.setDate(today.getDate() + lowStockDays);
                const nearStr = nearDate.toISOString().split("T")[0];
                stockFilters.ExpDate = { [db.Sequelize.Op.between]: [todayStr, nearStr] };
            } else if (expStatus === "upToDate") {
                const upTo = new Date();
                upTo.setDate(today.getDate() + lowStockDays);
                const upToStr = upTo.toISOString().split("T")[0];
                stockFilters.ExpDate = { [db.Sequelize.Op.gt]: upToStr };
            }

            if (stockStatus === "outOfStock") {
                stockFilters.stock = { [db.Sequelize.Op.lte]: 0 };
            } else if (stockStatus === "aboutEmpty") {
                stockFilters.stock = { [db.Sequelize.Op.gt]: 0, [db.Sequelize.Op.lt]: aboutToEmpty };
            } else if (stockStatus === "upToDate") {
                stockFilters.stock = { [db.Sequelize.Op.gte]: aboutToEmpty };
            }

            // const productFilters = {
            //     manufacturerId: { [db.Sequelize.Op.in]: authorizedBy }
            // };

            if (search) {
                stockFilters[db.Op.or] = [
                  { '$product.PName$':         { [db.Op.like]: `%${search}%` } },
                  { '$product.SaltComposition$': { [db.Op.like]: `%${search}%` } },
                ];
              }

            // Step 1: Get all products to count
            // const allProducts = await db.products.count({
            //     where: productFilters,
            // });

            // const totalCount = allProducts.length;

            // Step 2: Get paginated products only
            // const {rows:paginatedProducts,count} = await db.products.findAndCountAll({
            //     where: productFilters,
            //     include: [
            //         {
            //             model: db.stocks,
            //             as: "stocks",
            //             required: false,
            //             where: stockFilters,
            //             include:[
            //                 {
            //                     model:db.manufacturers,
            //                     as:"manufacturer",
            //                     attributes:['companyName','manufacturerCode']
            //                 },
            //                 {
            //                     model:db.distributors,
            //                     as:"distributor",
            //                     attributes:['companyName','distributorCode']
            //                 }
            //             ]
            //         },
            //         {
            //             model:db.manufacturers,
            //             as:"manufacturer",
            //             attributes:['companyName']
            //         }
            //     ],
            //     // order: [['PName', 'ASC']],
            //     order: [
            //         [
            //           db.sequelize.literal(`(
            //             SELECT CASE WHEN SUM(s.Stock) > 0 THEN 1 ELSE 0 END
            //             FROM stocks AS s
            //             WHERE s.PId = products.PId
            //           )`),
            //           'DESC'
            //         ],
            //         ['PName', 'ASC']
            //       ],                 
            //     offset: skip,
            //     limit: Limit
            // });
            const { rows: paginatedProducts, count } = await db.stocks.findAndCountAll({
                where: stockFilters,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        include: [
                            {
                                model: db.manufacturers,
                                as: "manufacturer",
                                attributes: ['companyName']
                            }
                        ]
                    },
                    {
                        model: db.manufacturers,
                        as: "manufacturer",
                        attributes: ['companyName', 'manufacturerCode']
                    },
                    {
                        model: db.distributors,
                        as: "distributor",
                        attributes: ['companyName', 'distributorCode']
                    }
                ],
                order:[['SId','desc']],
                offset: skip,
                limit: Limit
            })
            // return {paginatedProducts}
           
            const formatData = paginatedProducts?.map((stock)=>{
                return {
                    SId: stock.SId,
                    PId: stock?.PId,
                    BatchNo: stock?.BatchNo,
                    ExpDate: stock?.ExpDate,
                    MRP: stock?.MRP,
                    PTR: stock?.PTR,
                    PTS: stock?.PTS,
                    Scheme: stock?.Scheme,
                    BoxQty: stock?.BoxQty,
                    Loose: stock?.Loose,
                    Stock: stock?.Stock,
                    organisationId: stock?.organisationId,
                    entityId: stock?.entityId,
                    location: stock?.location,
                    createdAt: stock?.createdAt,
                    updatedAt: stock?.updatedAt,
                    purchasedFrom: stock?.manufacturer?.companyName || stock?.distributor?.companyName || stock.purchasedFrom,
                    purchasedFromCode: stock?.manufacturer?.manufacturerCode || stock?.distributor?.distributorCode || null,
                    stockStatus:stock?.Stock == 0?"Out of stock":Number(stock?.Stock)<Number(aboutToEmpty)?'About to empty':'Up to date',
                    expiryStatus:expiryStatus(stock.ExpDate,lowStockDays)  || null,
                    product: {
                        PId: stock?.product?.PId,
                        PCode: stock?.product?.PCode,
                        PName: stock?.product?.PName,
                        PackagingDetails: stock?.product?.PackagingDetails,
                        SaltComposition: stock?.product?.SaltComposition,
                        LOCKED: stock?.product?.LOCKED,
                        manufacturerId: stock?.product?.manufacturerId,
                        manufacturerName: stock?.product?.manufacturer?.companyName || null,
                        productForm: stock?.product?.ProductForm,
                        Package:stock?.product?.Package,
                    }
                }
            })
//             const formattedData = paginatedProducts.flatMap(product => {
//                 if (!product.stocks || product.stocks.length === 0) {
//                     return [{
//                         SId: null,
//                         PId: product.PId,
//                         BatchNo: null,
//                         ExpDate: null,
//                         MRP: null,
//                         PTR: null,
//                         PTS: null,
//                         Scheme: null,
//                         BoxQty: null,
//                         Loose: null,
//                         Stock: null,
//                         organisationId: null,
//                         entityId: null,
//                         location: null,
//                         createdAt: null,
//                         updatedAt: null,
//                         purchasedFrom: null,
//                         purchasedFromCode: null,
//                         product: {
//                             PId: product.PId,
//                             PCode: product.PCode,
//                             PName: product.PName,
//                             PackagingDetails: product.PackagingDetails,
//                             SaltComposition: product.SaltComposition,
//                             LOCKED: product.LOCKED,
//                             manufacturerId: product.manufacturerId,
//                             manufacturerName: product?.manufacturer?.companyName || null,
//                             productForm: product?.ProductForm
//                         }
//                     }];
//                 }
// // console.log(product)
//                 return product?.map(stock => ({
//                     SId: stock.SId,
//                     PId: product.PId,
//                     BatchNo: stock.BatchNo,
//                     ExpDate: stock.ExpDate,
//                     MRP: stock.MRP,
//                     PTR: stock.PTR,
//                     PTS: stock.PTS,
//                     Scheme: stock.Scheme,
//                     BoxQty: stock.BoxQty,
//                     Loose: stock.Loose,
//                     Stock: stock.Stock,
//                     organisationId: stock.organisationId,
//                     entityId: stock.entityId,
//                     location: stock.location,
//                     createdAt: stock.createdAt,
//                     updatedAt: stock.updatedAt,
//                     purchasedFrom: stock?.manufacturer?.companyName || stock?.distributor?.companyName || stock.purchasedFrom,
//                     purchasedFromCode: stock?.manufacturer?.manufacturerCode || stock?.distributor?.distributorCode || null,
//                     product: {
//                         PId: product.PId,
//                         PCode: product.PCode,
//                         PName: product.PName,
//                         PackagingDetails: product.PackagingDetails,
//                         SaltComposition: product.SaltComposition,
//                         LOCKED: product.LOCKED,
//                         manufacturerId: product.manufacturerId,
//                         manufacturerName: product?.manufacturer?.companyName || null,
//                         productForm: product?.ProductForm
//                     }
//                 }));
//             });

            return {
                status: message.code200,
                message: message.message200,
                totalData: count,
                totalPage: Math.ceil(count / Limit),
                currentPage: Page,
                apiData: formatData
            }

        } catch (err) {
            console.log("get_distributor_stocks error:", err.message);
            return {
                status: 500,
                message: err.message
            };
        }
    }
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
    async delete_document(data) {
        try {
            const { id, documentId } = data
            // console.log(id,documentId)
            await db.documents.update({ isDeleted: true }, { where: { documentId: Number(documentId), userId: Number(id) } })
            return {
                status: message.code200,
                message: 'Document deleted successfully'
            }
        } catch (error) {
            console.log('delete_document service error', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
}

const expiryStatus =  (ExpDate,nearToExpDate) => {
    const expDate = new Date(ExpDate);
    const today = new Date();

    // Calculate the difference in days
    const diffDays = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

    let expStatus;
    if (diffDays < 0) {
      expStatus = "expired";
    } else if (diffDays <= nearToExpDate) {
      expStatus = "Near expiry";
    } else {
      expStatus = "Up to date";
    }

    return expStatus
  }

module.exports = new DistributorService(db);
