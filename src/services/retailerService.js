const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const usercarts = require('../models/usercarts');
const { request } = require('express');
const Users = db.users;
const Retailers = db.retailers;
const Op = db.Op
const dayjs = require('dayjs');
const moment = require("moment");
const { where, NUMBER } = require('sequelize');
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



async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
}

class RetailerService {
    constructor(db) {
        this.db = db;
    }

    async createRetailers(data) {
        let transaction;
        try {
            const { userName, password, companyName } = data;

            if (!userName || !password || !companyName) {
                return {
                    status: message.code400,
                    message: "All fields are required",
                };
            }

            transaction = await db.sequelize.transaction();

            const hashedPassword = await hashPassword(password);
            const checkR = await db.users.findOne({ where: { userName: userName } })
            if (checkR) {
                return {
                    status: message.code400,
                    message: `User already registered with mail - ${userName}`
                }
            }
            //Create User
            const user = await Users.create(
                {
                    userName: userName,
                    password: hashedPassword,
                    userType: 'Retailer',
                    status: "Active",
                    isPasswordChangeRequired: false
                },
                { transaction }
            );

            //Generate retailerCode (RET-{id})
            const retailerCode = `RET-${user.id}`;

            //Create Retailer with retailerCode
            await Retailers.create(
                {
                    retailerId: user.id, // Assuming `id` is the primary key of the `users` table
                    firmName: companyName,
                    email: userName,
                    retailerCode: retailerCode, // Adding retailerCode
                },
                { transaction }
            );

            //Commit the transaction
            await transaction.commit();

            return {
                status: message.code200,
                message: message.message200,
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log("createRetailer error:", error.message);
            return {
                status: message.code500,
                message: error.message,
            };
        }

    }

    // async get_distributors_list(data) {
    //     try {
    //         const {search} = data
    //         let whereClause = {userType: ['distributor', 'cnfs']}
    //         if (search) {
    //             const halfLength = Math.floor(search.length / 2);
    //             const firstHalf = search.substring(0, halfLength);
    //             const firstThree = search.substring(0, 3);

    //             whereClause.userName = {
    //                 [Op.or]: [
    //                     { [Op.eq]: search },
    //                     { [Op.like]: `%${search}%` },
    //                     { [Op.like]: `%${firstHalf}%` },
    //                     { [Op.like]: `${firstThree}%` }
    //                 ]
    //             };
    //         }
    //         const Data = await db.users.findAll({
    //             attributes:['id','userName'],
    //             where:whereClause,
    //             include:[
    //                 {
    //                     model:db.distributors,
    //                     as:'disuser',
    //                     attributes:['companyName'],
    //                     required:true
    //                 }
    //             ]
    //         })
    //         const result = Data?.map((item)=>{
    //             return {
    //                 id:item.id,
    //                 userName:item?.disuser[0]?.companyName || item.userName
    //             }
    //         })
    //         return {
    //             status:message.code200,
    //             message:message.message200,
    //             apiData:result
    //         }
    //     } catch (error) {
    //         console.log('get_distributors_list service error:',error.message)
    //         throw new Error(error.message);
    //     }
    // }

    async get_distributors_list(data) {
        try {
            const { search } = data;
            if (!search) {
                const sss = await db.distributors.findAll({
                    attributes: ['companyName', 'distributorId', 'type'],
                    where: { "distributorId": { [db.Op.ne]: null } },
                    include: [
                        {
                            model: db.address,
                            as: 'addresses',
                            required: false,
                            attributes: ['addLine1', 'addLine2', 'city', 'state'],
                        }
                    ],
                    order: db.sequelize.random(),
                    limit: 5
                })
                const finalResult = sss?.map((item) => {
                    return {
                        "userName": item?.companyName,
                        "id": item.distributorId,
                        "userType": item.type,
                        "address": item.addresses[0] || {}
                    }
                })
                return {
                    status: message.code200,
                    message: message.message200,
                    apiData: finalResult
                }
            }
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions = search ? {
                [Op.or]: [
                    // { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    // { [Op.like]: `%${firstHalf}%` },
                    // { [Op.like]: `${firstThree}%` }
                ]
            } : null;

            // Get distributors (users + disuser)
            const whereClause = {
                userType: ['distributor', 'manufacturer']
            };

            if (search) {
                whereClause[Op.or] = [
                    { '$disuser.companyName$': { [Op.like]: `%${search}%` } },
                    { '$manufacturer.companyName$': { [Op.like]: `%${search}%` } }
                ];
            }

            const userInclude = [{
                model: db.distributors,
                as: 'disuser',
                attributes: ['companyName', 'type'],
                // required: true
            },
            {
                model: db.manufacturers,
                as: 'manufacturer',
                attributes: ['companyName'],
                // required: true
            },
            {
                model: db.address,
                as: 'addresss',
                attributes: ['addLine1', 'addLine2', 'city', 'state'],
                required: false
            }
            ];

            if (search) {
                userInclude.where = {
                    companyName: likeConditions
                };
            }

            const users = await db.users.findAll({
                attributes: ['id', 'userName'],
                where: whereClause,
                include: userInclude
            });


            const userResults = users.map(item => ({
                id: item.id,
                userType: item?.disuser[0]?.type || 'Manufacturer',
                userName: item?.disuser[0]?.companyName || item?.manufacturer[0]?.companyName || item?.userName,
                address: item.addresss[0] || {}
            }));


            return {
                status: message.code200,
                message: message.message200,
                apiData: userResults
            }
        } catch (error) {
            console.log('get_distributors_list service error:', error.message);
            throw new Error(error.message);
        }
    }

    async get_search_by_product(data) {
        try {
            const { search, id } = data;
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions = search ? {
                [Op.or]: [
                    // { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    // { [Op.like]: `%${firstHalf}%` },
                    // { [Op.like]: `${firstThree}%` }
                ]
            } : null;

            let productResults = [];
            let stockWhere = {};
            if (id) {
                stockWhere.organisationId = { [db.Op.ne]: Number(id) }
            }
            if (search) {
                const products = await db.products.findAll({
                    attributes: ['PId', 'PName', 'PackagingDetails', 'SaltComposition', 'HSN', 'ProductForm', 'Package', 'Quantity'],
                    include: [
                        {
                            model: db.stocks,
                            as: 'stocks',
                            attributes: ['SId', 'PId', 'Stock', 'Scheme', 'MRP', 'PTR', 'organisationId'],
                            where: stockWhere,
                            required: true,
                            include: [
                                {
                                    model: db.distributors,
                                    as: 'distributors',
                                    attributes: ['companyName', 'type'],
                                    required: true
                                }
                            ]
                        },
                        {
                            model: db.manufacturers,
                            as: 'manufacturer',
                            attributes: ['manufacturerId', 'companyName']
                        }
                    ],
                    where: {
                        PName: likeConditions
                    }
                });
                // console.log(products.length,';;;;;;;;;;;;;;;;;;')

                productResults = products.map(p => ({
                    PId: p.PId,
                    PName: p.PName
                }));
                const processed = products.map(product => {
                    const parseScheme = (scheme) => {
                        const parts = scheme?.split('+').map(Number);
                        return parts?.length === 2 && parts.every(n => !isNaN(n)) ? (parts[1] / parts[0]) * 100 : 0;
                    };

                    // Start reduce with first stock as default (because we know stocks always exist)
                    const bestStock = product.stocks.reduce((best, current) => {
                        return parseScheme(current.Scheme) > parseScheme(best.Scheme) ? current : best;
                    }, product.stocks[0]); // 👈 start with first stock

                    let sss = {
                        "SId": bestStock?.SId || "",
                        "PId": bestStock?.PId || "",
                        "Stock": bestStock?.Stock || 0,
                        "Scheme": bestStock?.Scheme || "",
                        "MRP": bestStock.MRP || 0,
                        "PTR": bestStock.PTR || 0,
                        "organisationId": bestStock?.organisationId || null,
                        "distributor": bestStock.distributors || {},
                    }
                    return {
                        PId: product.PId,
                        PName: product.PName,
                        PackagingDetails: product.PackagingDetails,
                        SaltComposition: product.SaltComposition,
                        bestStock: sss,
                        HSN: product?.HSN || null,
                        ProductForm: product?.ProductForm || null,
                        Package: product?.Package || null,
                        Quantity: product?.Quantity || null,
                        manufacturer: product?.manufacturer?.companyName || null
                    };
                });

                // console.log(processed.length,';;;;;;;;;;;;;;;;;;')
                return {
                    status: message.code200,
                    message: message.message200,
                    apiData: processed,
                    // products
                }
            }
        } catch (error) {
            console.log('get_search_by_product service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    // async retailer_profile_update(req) {
    //     let transaction;
    //     try {
    //         const userId = req.user?.id;
    //         if (!userId) {
    //             return { status: 400, message: "User ID is required" };
    //         }

    //         const { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic, businessAdd, billingAdd, documents } = req.body;

    //         transaction = await db.sequelize.transaction({ timeout: 30000 });

    //         // ✅ Check if retailer exists
    //         const retailer = await db.retailers.findOne({ where: { retailerId: userId }, transaction });

    //         if (!retailer) {
    //             await db.retailers.create(
    //                 { retailerId: userId, ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic },
    //                 { transaction }
    //             );
    //         } else {
    //             await db.retailers.update(
    //                 { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic },
    //                 { where: { retailerId: userId }, transaction }
    //             );
    //         }

    //         // ✅ Address Handling (Ensuring Update Instead of Insert)
    //         const addressTypes = [
    //             { data: businessAdd, type: "Business" },
    //             { data: billingAdd, type: "Billing" }
    //         ];

    //         for (const addr of addressTypes) {
    //             if (addr.data) {
    //                 const existingAddress = await db.address.findOne({
    //                     where: { userId, addressType: addr.type },
    //                     transaction
    //                 });

    //                 if (existingAddress) {
    //                     await db.address.update(
    //                         { ...addr.data },
    //                         { where: { userId, addressType: addr.type }, transaction }
    //                     );
    //                     console.log(`Updated ${addr.type} Address`);
    //                 } else {
    //                     await db.address.create(
    //                         { ...addr.data, userId, addressType: addr.type },
    //                         { transaction }
    //                     );
    //                     console.log(`Inserted ${addr.type} Address`);
    //                 }
    //             }
    //         }

    //         // ✅ Fetch document categories for Retailer
    //         const documentCategories = await db.documentCategory.findAll({
    //             attributes: ['id', 'documentName'],
    //             where: { category: "Retailer" },
    //             raw: true,
    //             transaction
    //         });

    //         // ✅ Create a mapping of document names to category IDs
    //         const categoryMap = {};
    //         documentCategories.forEach(doc => {
    //             categoryMap[doc.documentName] = doc.id;
    //         });

    //         console.log("Document Categories:", categoryMap);

    //         // ✅ Document Handling (Ensure each document gets correctly updated)
    //         const documentMapping = [
    //             { name: "PAN", image: documents?.PAN },
    //             { name: "GST", image: documents?.GST },
    //             { name: "CIN", image: documents?.CIN },
    //             { name: "DrugLicense", image: documents?.DrugLicense },
    //             { name: "ISO", image: documents?.ISO }
    //         ];

    //         for (const doc of documentMapping) {
    //             if (doc.image && categoryMap[doc.name]) {
    //                 const categoryId = categoryMap[doc.name]; // Get categoryId using document name

    //                 const existingDoc = await db.documents.findOne({
    //                     where: { userId, categoryId },
    //                     transaction
    //                 });

    //                 if (existingDoc) {
    //                     await db.documents.update(
    //                         { image: doc.image, status: 'Verified' },
    //                         { where: { userId, categoryId }, transaction }
    //                     );
    //                     console.log(`Updated ${doc.name}: ${doc.image}`);
    //                 } else {
    //                     await db.documents.create(
    //                         { userId, categoryId, image: doc.image, status: 'Verified' },
    //                         { transaction }
    //                     );
    //                     console.log(`Inserted ${doc.name}: ${doc.image}`);
    //                 }
    //             }
    //         }

    //         await transaction.commit();
    //         return { status: 200, message: "Retailer details updated successfully" };
    //     } catch (error) {
    //         console.error('retailer_profile_update service error:', error.message);
    //         if (transaction) await transaction.rollback();
    //         return { status: 500, message: "Internal Server Error" };
    //     }
    // }

    async retailer_profile_update(data) {
        let transaction;
        // console.log(data);
        try {
            const { retailerId, profilePic, firmName, companyType, ownerName, email, phone, address, GST, FSSAI, PAN, CIN, drugLicense, businessAdd, billingAdd, documents, distributors } = data;

            if (!retailerId) {
                return {
                    status: message.code400,
                    message: "Retailer ID is required",
                };
            }
            transaction = await db.sequelize.transaction({ timeout: 30000 });

            // Fetch distributor
            const retailer = await db.retailers.findOne({
                where: { retailerId },
                transaction
            });

            // console.log('Fetched retailer:', retailer);

            if (!retailer) {
                return {
                    status: 404,
                    message: "Retailer not found",
                };
            }

            //auhtorizations update
            const authhh = distributors.map((item) => ({
                authorizedBy: Number(item),
                authorizedId: Number(retailerId),
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
            await db.retailers.update(
                {
                    profilePic,
                    firmName,
                    companyType,
                    ownerName,
                    email,
                    phone,
                    address,
                    GST,
                    PAN,
                    FSSAI,
                    CIN,
                    // licence,
                    drugLicense
                },
                { where: { retailerId }, transaction }
            );

            // console.log("Retailer updated successfully");

            // address updates
            const existingAddresses = await db.address.findAll({ where: { userId: retailerId }, transaction });
            if (existingAddresses.length) {
                await Promise.all(existingAddresses.map(async (existingAddress) => {
                    const updateData =
                        existingAddress.addressType === "Business" ? businessAdd : billingAdd;
                    await existingAddress.update(updateData, { transaction });
                }));
            } else {
                const dataToInsert = [
                    { ...businessAdd, userId: retailerId, addressType: "Business" },
                    { ...billingAdd, userId: retailerId, addressType: "Billing" },
                ];
                await db.address.bulkCreate(dataToInsert, { transaction });
            }

            // documents update
            const documentsData = documents.map((doc) => ({
                categoryId: doc.id,
                image: doc.image,
                status: 'Verified',
                imageSize: doc?.imageSize ? formatSize(doc?.imageSize || 0) : "0KB",
                userId: Number(retailerId),
                isDeleted: false
            }));

            await db.documents.bulkCreate(documentsData, {
                updateOnDuplicate: ["image", "status", 'imageSize', 'isDeleted'],
                conflictFields: ["categoryId", "userId", 'isDeleted'],
                transaction
            });

            //Getting manufcturerName that is passed in the payLoad
            const distributerNames = await db.distributors.findAll({
                where: { distributorId: distributors },
                attributes: ['distributorId', 'companyName'],
                raw: true,
                transaction
            });

            const distributerList = distributerNames.map(manu => ({
                distributorId: manu.distributorId,
                companyName: manu.companyName
            }));

            await transaction.commit();
            // console.log("Retailer details updated successfully");
            return {
                status: message.code200,
                message: "Retailer details updated successfully",
                manufacturers: distributerList,
                documents: documentsData
            };
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('retailer_profile_update service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async retailer_profile_get(data) {
        try {
            // console.log(data)
            const { id } = data

            const [aa] = await db.sequelize.query(
                `SELECT documentName FROM documentcategory WHERE category = 'Retailer'`
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
                            isDeleted: { [db.Op.not]: true }
                        },
                        required: false,
                    },
                ],
                where: { category: "Retailer" }
            })
            let columns = [];
            if (aa) {
                columns = aa.map((item) => item.documentName);
            }
            console.log(document)
            const documentColumns = columns.length > 0 ? columns.map(col => `doc.\`${col}\``).join(", ") : '';

            const documentColumnsQuery = documentColumns ? `, ${documentColumns}` : '';

            const query = `
            SELECT 
              us.*, 
              ad.*,
              mn.email as Email,
              mn.retailerId,
              mn.firmName,
        mn.ownerName,
        mn.profilePic,
        mn.createdAt,
        mn.updatedAt,
        mn.address,
        mn.phone,
        mn.GST as gst,
        mn.retailerId,
        mn.FSSAI,
        mn.drugLicense,
        mn.companyType,
        mn.PAN as pan,
        mn.CIN as cin
            FROM retailers AS mn
            LEFT JOIN users AS us 
              ON mn.retailerId = us.id
            LEFT JOIN address AS ad
              ON mn.retailerId = ad.userId
            WHERE mn.retailerId = ${id};
          `;

            let [dataa] = await db.sequelize.query(query);
            const transformedData = {};
            const authorizedBy = await db.authorizations.findAll({
                where: { authorizedId: Number(id) },
                attributes: ['authorizedId', 'authorizedBy'],
                include: [
                    {
                        model: db.distributors,
                        as: "distributor",
                        attributes: ['distributorId', 'companyName', 'type'],
                        required: true
                    }
                ]
            })
            const auth = authorizedBy?.map((item) => {
                return {
                    authorizedBy: item.authorizedBy,
                    authorizedByUser: item?.distributor?.companyName || null,
                    type: item?.distributor?.type
                }
            })
            console.log(dataa)
            dataa.forEach((row) => {
                const distributorId = row.distributorId;

                if (!transformedData[distributorId]) {
                    transformedData[distributorId] = {
                        retailer: {
                            retailerId: row.retailerId,
                            companyName: row.firmName,
                            ownerName: row.ownerName,
                            companyType: row.companyType,
                            wholeSaleDrugLicence: row.drugLicense,
                            // licence : row.licence,
                            logo: row.profilePic,
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt,
                            address: row.address,
                            phone: row.phone,
                            email: row.Email,
                            GST: row.gst,
                            FSSAI: row.FSSAI,
                            distributorId: row.retailerId,
                            PAN: row.pan,
                            CIN: row.cin,
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
            });


            const result = Object.values(transformedData);
            return {
                status: message.code200,
                message: message.message200,
                apiData: result[0]
            }
        } catch (error) {
            console.log('retailer_profile_get service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    //Retailer distributor k stocks dekh rha h
    async get_stocks_byDistributor(data) {
        try {
            const { distributorId, id, page, limit, expStatus, search, stockStatus, entityId } = data
            console.log(data)
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = 0;
            if (Page > 1) {
                skip = (Page - 1) * Limit;
            }
            const nearToExpDate = Number(process.env.lowStockDays)
            // console.log(distributorId)
            let whereCondition = { organisationId: Number(distributorId), locked: false };
            if (entityId) {
                whereCondition.entityId = Number(entityId);
            }

            // Handle expiration status filter
            if (expStatus) {
                const today = new Date();
                const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

                if (expStatus === "expired") {
                    whereCondition.ExpDate = {
                        [db.Sequelize.Op.lt]: todayStr, // Expired before today
                    };
                } else if (expStatus === "nearToExp") {
                    const nearToExpDate = new Date();
                    nearToExpDate.setDate(today.getDate() + 90); // Add 90 days
                    const nearToExpStr = nearToExpDate.toISOString().split("T")[0];

                    whereCondition.ExpDate = {
                        [db.Sequelize.Op.between]: [todayStr, nearToExpStr], // Between today and 90 days
                    };
                } else if (expStatus === "upToDate") {
                    const upToDateThreshold = new Date();
                    upToDateThreshold.setDate(today.getDate() + 90); // More than 90 days from today
                    const upToDateStr = upToDateThreshold.toISOString().split("T")[0];

                    whereCondition.ExpDate = {
                        [db.Sequelize.Op.gt]: upToDateStr,
                    };
                }
            }

            if (stockStatus) {
                const count = Number(process.env.aboutToEmpty)
                if (stockStatus === "outOfStock") {
                    whereCondition.stock = {
                        [db.Op.lte]: 0
                    };
                } else if (stockStatus === "aboutEmpty") {
                    whereCondition.stock = {
                        [db.Op.gt]: 0,
                        [db.Op.lt]: count
                    };
                } else if (stockStatus === "upToDate") {
                    whereCondition.stock = {
                        [db.Op.gte]: count
                    };
                }
            }
            const productInclude = {
                model: db.products,
                as: 'product',
                attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED", "manufacturerId"],
                required: true
            };

            if (search) {
                const conditions = [];

                if (search.length) {
                    conditions.push(
                        { BatchNo: { [db.Op.like]: `%${search}%` } }
                    );
                    productInclude.where = {
                        [db.Op.or]: [
                            { PName: { [db.Op.like]: `%${search}%` } },
                            { SaltComposition: { [db.Op.like]: `%${search}%` } }
                        ]
                    };
                }
                // else {
                //     const mid = Math.floor(search.length / 2);
                //     const firstHalf = search.slice(0, mid);
                //     const secondHalf = search.slice(mid);
                //     const firstThree = search.slice(0, 3);

                //     productInclude.where = {
                //         [db.Op.or]: [
                //             { PName: { [db.Op.like]: `%${search}%` } },
                //             { PName: { [db.Op.like]: `%${firstHalf}%` } },
                //             { PName: { [db.Op.like]: `%${secondHalf}%` } },
                //             { PName: { [db.Op.like]: `${firstThree}%` } },
                //             { SaltComposition: { [db.Op.like]: `%${search}%` } },
                //             { SaltComposition: { [db.Op.like]: `%${firstHalf}%` } },
                //             { SaltComposition: { [db.Op.like]: `%${secondHalf}%` } },
                //             { SaltComposition: { [db.Op.like]: `${firstThree}%` } },
                //         ]
                //     };
                // }

                // whereCondition[db.Op.or] = conditions;
            }
            // console.log(productInclude,whereCondition)
            let checkAuth;
            let checkCart;
            if (id) {
                checkAuth = await db.authorizations.findOne({ where: { authorizedId: Number(id), authorizedBy: Number(distributorId) } })
                checkCart = await db.usercarts.findAll({ where: { orderFrom: Number(id), orderTo: Number(distributorId) } })
            }
            // let skip = Page>1?(Page - 1) * Number(Limit):Limit
            // console.log(id, "checkCart")
            const userDataa = await db.users.findOne({
                where: { id: Number(distributorId) },
                attributes: ['id', 'userName', 'userType'],
                include: [
                    {
                        model: db.distributors,
                        as: 'disuser',
                        // attributes:['distributorId','companyName',"profilePic",''],
                    },
                    {
                        model: db.manufacturers,
                        as: "manufacturer"
                    },
                    {
                        model: db.address,
                        as: 'addresss',
                    }
                ]
            })
            const userData = {
                "id": userDataa?.id,
                "userName": userDataa?.userName,
                "userType": 'Distributor',
                "disuser": userDataa?.disuser.length > 0 ? userDataa?.disuser : userDataa?.manufacturer,
                "addresss": userDataa?.addresss
            }
            // const { rows: stocks, count } = await db.stocks.findAndCountAll({
            //     // attributes:[]
            //     where: {
            //         ...whereCondition,
            //         locked: false,
            //     },
            //     include: [
            //         {
            //             model: db.products,
            //             as: 'product',
            //             attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED", "manufacturerId"]
            //         }
            //     ],
            //     offset: skip,
            //     limit: Limit,
            // })
            let count=0
            let stocks;
            console.log(userData.userType)
            if (userDataa?.userType === 'Distributor') {
                 stocks = await db.stocks.findAll({
                    attributes: [
                        // 'SId',
                        'PId',
                        'BatchNo',
                        [db.Sequelize.fn('MAX', db.Sequelize.col('SId')), 'SId'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'quantity'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('ExpDate')), 'ExpDate'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.MRP')), 'MRP'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.PTR')), 'PTR'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.Scheme')), 'Scheme'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.BoxQty')), 'BoxQty'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.Loose')), 'Loose'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('Stock')), 'Stock'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('organisationId')), 'organisationId'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.entityId')), 'entityId'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.location')), 'location'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.createdAt')), 'createdAt'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('stocks.updatedAt')), 'updatedAt'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('purchasedFrom')), 'purchasedFrom'],
                    ],
                    where: {
                        ...whereCondition,
                        Stock: { [db.Op.gt]: 0 }
                    },
                    include: [productInclude],
                    group: ['PId', 'BatchNo'],
                    offset: skip,
                    limit: Limit,
                })
                count = await db.stocks.count({
                where: {
                    ...whereCondition,
                    Stock: { [db.Op.gt]: 0 }
                },
                group: ['PId', 'BatchNo'],
            })
            } else {
                 stocks = await db.manufacturerStocks.findAll({
                    attributes: [
                        // 'SId',
                        'PId',
                        'BatchNo',
                        [db.Sequelize.fn('MAX', db.Sequelize.col('SId')), 'SId'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('quantity')), 'quantity'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('ExpDate')), 'ExpDate'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.MRP')), 'MRP'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.PTS')), 'PTS'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.Scheme')), 'Scheme'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.BoxQty')), 'BoxQty'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.Loose')), 'Loose'],
                        [db.Sequelize.fn('SUM', db.Sequelize.col('Stock')), 'Stock'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('organisationId')), 'organisationId'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.entityId')), 'entityId'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.location')), 'location'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.createdAt')), 'createdAt'],
                        [db.Sequelize.fn('MAX', db.Sequelize.col('manufacturer_stocks.updatedAt')), 'updatedAt'],
                        // [db.Sequelize.fn('MAX', db.Sequelize.col('purchasedFrom')), 'purchasedFrom'],
                    ],
                    where: {
                        ...whereCondition,
                        Stock: { [db.Op.gt]: 0 }
                    },
                    include: [productInclude],
                    group: ['PId', 'BatchNo'],
                    offset: skip,
                    limit: Limit,
                })
                count = await db.manufacturerStocks.count({
                where: {
                    ...whereCondition,
                    Stock: { [db.Op.gt]: 0 }
                },
                group: ['PId', 'BatchNo'],
            })
            }


            const updatedApiData = stocks.map(item => {
                const match = checkCart?.find(cart => cart.stockId === item.SId && cart.PId === item.PId);
                // item.quantity=match ? match.quantity : 0
                // return item

                return {
                    "SId": item?.SId,
                    "PId": item?.PId,
                    "BatchNo": item?.BatchNo,
                    "ExpDate": item?.ExpDate,
                    "MRP": item?.MRP,
                    "PTR":userData?.userType === 'Distributor'? item?.PTR :item?.PTS ,
                    // "PTS": item?.PTS,
                    "Scheme": item?.Scheme,
                    "BoxQty": item?.BoxQty,
                    "Loose": item?.Loose,
                    "Stock": item?.Stock,
                    "organisationId": item?.organisationId,
                    "entityId": item?.entityId,
                    "location": item?.location,
                    "createdAt": item?.createdAt,
                    "updatedAt": item?.updatedAt,
                    "purchasedFrom": item?.purchasedFrom || null,
                    "quantity": match ? match.quantity : 0,
                    "product": {
                        "PId": item?.product?.PId,
                        "PCode": item?.product?.PCode,
                        "PName": item?.product?.PName,
                        "PackagingDetails": item?.product?.PackagingDetails,
                        "SaltComposition": item?.product?.SaltComposition,
                        "LOCKED": item?.product?.LOCKED,
                        "manufacturerId": item?.product?.manufacturerId
                    }
                }
            });
            // console.log(distributorId,id)
            return {
                status: message.code200,
                message: message.message200,
                currentPage: Page,
                totalItem: count.length || 0,
                totalPage: Math.ceil(count.length / Limit),
                authCheck: checkAuth ? checkAuth?.status : 'Not Send',
                userData: userData,
                apiData: updatedApiData
            }
        } catch (error) {
            console.log('get_stocks_byDistributor service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async get_retailer_po_list(data) {
        try {
            const id = Number(data.id);
            const Page = Number(data.page) || 1;
            const Limit = Number(data.limit) || 10;
            let skip = 0;
            let whereClause = { orderFrom: id };
            console.log(id)
            if (Page > 1) {
                skip = (Page - 1) * Limit;
            }

            // Adjust search condition
            if (data.search) {
                whereClause[Op.or] = [
                    { id: { [Op.like]: `%${data.search}%` } }, // Search by order ID
                    {
                        '$distributor.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
                    },
                    // {
                    //   '$distributor_new.companyName$': { [Op.like]: `%${data.search}%` } // Search by manufacturer name
                    // }
                ];
            }
            if (data.start_date && data.end_date) {
                const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
                const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

                whereClause.orderDate = {
                    [Op.between]: [startDate, endDate]
                };
            }
            // console.log(whereClause)
            const { count, rows: orders } = await db.orders.findAndCountAll({
                attributes: [
                    "id",
                    "orderDate",
                    "dueDate",
                    "deliveredAt",
                    "invAmt",
                    "orderStatus",
                    "orderTo",
                    "orderFrom",
                    "orderTotal",
                    "invNo",
                    "balance",
                    "dMan",
                    "dMobile",
                    "deliveryType",
                    "reason"
                ],
                include: [
                    {
                        model: db.distributors,
                        as: "distributor",
                        attributes: ["companyName"],
                        required: false, // Ensure manufacturer is included even if no match is found
                    },
                    // {
                    //   model:db.authorizations,
                    //   where:{authorizedId:Number(id)},
                    //   as:"auth",
                    //   attributes:['creditCycle'],
                    //   required:false
                    // }
                ],
                where: whereClause,
                order: [["id", "DESC"]],
                offset: skip,
                limit: Limit
            });
            // "ENUM('Pending', 'Confirmed', 'Rejected', 'Ready to ship', 'Ready to pickup', 'Dispatched', 'Received', 'Paid', 'Partially paid', 'Canceled')"
            // const updatesResult = orders?.map((order) => {
            //   let overdue = false;

            //   if (order.deliveredAt && order.auth?.creditCycle) {
            //       const deliveredDate = new Date(order.deliveredAt);

            //       deliveredDate.setDate(deliveredDate.getDate() + order.auth.creditCycle);
            //       const today = new Date();
            //       today.setHours(0, 0, 0, 0);
            //       overdue = deliveredDate < today;
            //   }

            //       return {
            //           "id": order.id,
            //           "orderDate": order.orderDate,
            //           "dueDate": order.dueDate,
            //           "deliveredAt": order.deliveredAt,
            //           "invAmt": order.invAmt,
            //           "status": order.orderStatus,
            //           "orderTotal": order.orderTotal,
            //           "invNo": order.invNo,
            //           "balance": order.balance,
            //           "orderTo": order.manufacturer?.companyName || order?.distributor.companyName || order?.order,
            //           "deliveryType": order.deliveryType,
            //           // "auth": order.auth,
            //           "overdue": overdue 
            //       };
            //   });


            return {
                status: message.code200,
                message: message.message200,
                totalItems: count,
                currentPage: Page,
                totalPage: Math.ceil(count / Limit),
                apiData: orders,
            };
        } catch (error) {
            console.log('get_retailer_po_list error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async po_page_card_data_retailer(data) {
        try {
            const { id } = data;
            const userId = Number(id);
            let whereauthApproved = { authorizedId: userId, status: "Approved" }
            let whereauthPending = { authorizedId: userId, status: "Pending" }
            let whereorders = { orderFrom: userId }

            if (data.start_date && data.end_date) {
                const startDate = moment(data.start_date, "DD-MM-YYYY").startOf("day").format("YYYY-MM-DD HH:mm:ss");
                const endDate = moment(data.end_date, "DD-MM-YYYY").endOf("day").format("YYYY-MM-DD HH:mm:ss");

                whereorders.orderDate = {
                    [Op.between]: [startDate, endDate]
                };
                whereauthPending.createdAt = {
                    [Op.between]: [startDate, endDate]
                };
                whereauthApproved.createdAt = {
                    [Op.between]: [startDate, endDate]
                };
            }

            // Parallelizing queries for better performance
            const [orderStats, distributors, pendingAuthorizations] = await Promise.all([
                db.orders.findOne({
                    attributes: [
                        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "totalOrders"], // Total orders
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Settled') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus NOT IN ('Rejected','Cancelled','Settled') THEN 1 ELSE 0 END")), "pendingOrders"],
                        [db.sequelize.fn("COUNT", db.sequelize.literal("CASE WHEN balance > 0 THEN 1 ELSE NULL END")), "totalDueAmtOrders"], // Count of due amount orders
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN balance > 0 THEN balance ELSE 0 END")), "totalDueAmount"] // Sum of due amounts
                    ],
                    where: whereorders,
                    raw: true,
                }),


                // Fetch total retailers grouped by companyType
                db.authorizations.count({ where: whereauthApproved }),

                // Count pending authorizations
                db.authorizations.count({ where: whereauthPending }),
            ]);


            // Extract retailer counts based on companyType
            // const totalRetailersCount = retailerCounts.length > 0 ? Number(retailerCounts[0]?.totalRetailers) || 0 : 0;

            return {
                status: 200,
                message: "Data fetched successfully",
                data: {
                    totalOrders: Number(orderStats?.totalOrders) || 0,
                    completedOrders: Number(orderStats?.completedOrders) || 0,
                    pendingOrders: (Number(orderStats?.pendingOrders) || 0),
                    totalDueAmtOrders: orderStats?.totalDueAmtOrders ? Number(orderStats.totalDueAmtOrders.toFixed(2)) : 0.0,
                    totalDueAmount: orderStats?.totalDueAmount ? Number(orderStats.totalDueAmount.toFixed(2)) : 0.0,
                    distributors: distributors,
                    pendingAuthorizations,
                },
            };
        } catch (error) {
            console.log('po_page_card_data_retailer error:', error.message)
            return {
                status: message.code500,
                message: message.message500
            }
        }
    }

    async retailers_stock_card_data(data) {
        try {
            const { id } = data
            const nearExpiryDays = Number(process.env.lowStockDays || 90);
            // const nearExpiryDays = Number(process.env.lowStockDays || 90);
            const now = dayjs().format('YYYY-MM-DD');
            const nearExpiryDate = dayjs().add(nearExpiryDays, 'day').format('YYYY-MM-DD');

            const [result] = await db.sequelize.query(
                `
                SELECT
                    SUM(CASE WHEN DATE(ExpDate) < :now THEN 1 ELSE 0 END) AS expiredStock,
                    SUM(CASE WHEN DATE(ExpDate) >= :now AND DATE(ExpDate) <= :nearExpiry THEN 1 ELSE 0 END) AS nearToExpiry,
                    SUM(CASE WHEN DATE(ExpDate) > :nearExpiry THEN 1 ELSE 0 END) AS uptoDate,
                    MAX(updatedAt) AS lastUpdated
                FROM stocks
                WHERE organisationId = :id
                `,
                {
                    replacements: {
                        now,
                        nearExpiry: nearExpiryDate,
                        id: Number(id)
                    },
                    // type: db.sequelize.QueryTypes.SELECT,
                }
            );



            return {
                status: message.code200,
                message: message.message200,
                apiData: {
                    "expiredStock": String(result[0]?.expiredStock) || null,
                    "nearToExpiry": String(result[0]?.nearToExpiry) || null,
                    "uptoDate": String(result[0]?.uptoDate) || null,
                    "lastUpdated": result[0]?.lastUpdated || null,
                    "allProducts": "0",
                    "unlocked": "0"
                },
                // result
            };

            // return { result }
        } catch (error) {
            console.log('retailers_stock_card_data service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }

    async retailer_medicine_add(data) {
        try {
            const { id } = data
            console.log(data)
            if (!data?.PName || !data?.BatchNo || !data?.ExpDate || !data?.MRP || !data?.PTR || !data?.manufacturerName || !data?.ProductForm || !data?.Package || !data?.Quantity || !data?.location || !data?.Stock || !data.SaltComposition) {
                return {
                    status: message.code400, message: 'Invalid input'
                }
            }
            if (data?.PId && data?.purchasedFromId) {
                const check = await db.stocks.findOne({
                    where: { PId: Number(data?.PId), BatchNo: Number(data?.BatchNo), purchasedFrom: Number(data?.purchasedFromId), organisationId: Number(id) }
                })
                let updateStock = Number(check?.Stock) + Number(data?.Stock)
                if (check) {
                    await db.stocks.update({ Stock: updateStock }, { where: { PId: Number(data?.PId), BatchNo: Number(data?.BatchNo), purchasedFrom: Number(data?.purchasedFromId), organisationId: Number(id) } })
                } else {
                    await db.stocks.create({
                        BatchNo: data?.BatchNo,
                        ExpDate: data?.ExpDate,
                        PId: Number(data?.PId),
                        MRP: Number(data?.MRP),
                        PTR: Number(data?.PTR),
                        PTS: Number(data?.PTS),
                        Scheme: data?.Scheme || null,
                        BoxQty: data?.BoxQty || null,
                        Loose: data?.Loose || null,
                        Stock: data?.Stock,
                        location: data?.location,
                        organisationId: Number(id),
                        purchasedFrom: Number(data?.purchasedFromId)
                    })
                }
                return {
                    status: message.code200,
                    message: 'Stock updated successfully'
                }
            } else {
                const header = await db.sequelize.query(
                    `
                INSERT INTO tempProduct_header 
                  (uploadedBy, fileName, total_Item, notMapped, createdAt, updatedAt, mapStatus)
                VALUES 
                  (?, ?, ?, ?, ?, ?, ?)
                `,
                    {
                        replacements: [
                            Number(data.id),
                            data?.fileName || 'http://null',
                            1,
                            1,
                            new Date(),
                            new Date(),
                            'Pending'
                        ],
                        //   type: db.Sequelize.QueryTypes.INSERT
                    }
                );
                // console.log(header[0])
                const details = await db.sequelize.query(
                    `
                INSERT INTO tempProduct_details (
                   manufacturername, headerId, PName, Package,
                  ProductForm, Quantity, SaltComposition,MRP, PTR, PTS, LOCKED, createdAt, updatedAt,
                  BatchNo, ExpDate, Scheme, Stock, location, HSN, purchasedFrom,BoxQty,Loose
                )
                VALUES (
                  ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?,?,?
                )
                `,
                    {
                        replacements: [
                            data?.manufacturerName, header[0], data?.PName,
                            data?.Package, data?.ProductForm, data?.Quantity, data?.SaltComposition,
                            data.MRP,
                            data.PTR, data.PTS, false, new Date(),
                            new Date(), data?.BatchNo, new Date(data?.ExpDate), data?.Scheme || null,
                            data?.Stock, data?.location, data?.HSN, data?.purchasedFrom, data?.BoxQty || null, data?.Loose || null
                        ],
                        //   type: db.Sequelize.QueryTypes.INSERT
                    }
                );
                return {
                    status: message.code200,
                    message: 'Stock save for mapping'
                }

            }

            return {
                status: 200
            }
        } catch (error) {
            console.log('retailer_medicine_add service error:', error.message)
            return {
                status: message.code500,
                message: error.message
            }
        }
    }
}
module.exports = new RetailerService(db);