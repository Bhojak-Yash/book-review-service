const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const usercarts = require('../models/usercarts');
const { request } = require('express');
const Users = db.users;
const Retailers = db.retailers;
const Op = db.Op
const moment = require("moment");
const { where } = require('sequelize');
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

            //Create User
            const user = await Users.create(
                {
                    userName: userName,
                    password: hashedPassword,
                    userType: 'Retailer',
                    status: "Active",
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
                    email:userName,
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
            if(search.length <3){
                return{
                    status: message.code400,
                    message: "Invalid Imput",
                }
            }
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions = search ? {
                [Op.or]: [
                    { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    { [Op.like]: `%${firstHalf}%` },
                    { [Op.like]: `${firstThree}%` }
                ]
            } : null;

            // Get distributors (users + disuser)
            const whereClause = {
                userType: ['distributor', 'cnfs']
            };

            if (search) {
                whereClause[Op.or] = [
                    { '$disuser.companyName$': { [Op.like]: `%${search}%` } }
                ];
            }

            const userInclude = [{
                model: db.distributors,
                as: 'disuser',
                attributes: ['companyName', 'type'],
                required: true
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
                userType: item?.disuser[0]?.type || null,
                userName: item?.disuser[0]?.companyName || item.userName,
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
            const { search } = data;
            const halfLength = Math.floor(search?.length / 2);
            const firstHalf = search?.substring(0, halfLength);
            const firstThree = search?.substring(0, 3);

            const likeConditions = search ? {
                [Op.or]: [
                    { [Op.eq]: search },
                    { [Op.like]: `%${search}%` },
                    { [Op.like]: `%${firstHalf}%` },
                    { [Op.like]: `${firstThree}%` }
                ]
            } : null;

            let productResults = [];
            if (search) {
                const products = await db.products.findAll({
                    attributes: ['PId', 'PName', 'PackagingDetails', 'SaltComposition'],
                    include: [
                        {
                            model: db.stocks,
                            as: 'stocks',
                            attributes: ['SId', 'PId', 'Stock', 'Scheme', 'MRP', 'PTR', 'organisationId'],
                            required: true,
                            include: [
                                {
                                    model: db.distributors,
                                    as: 'distributors',
                                    attributes: ['companyName'],
                                    required: true
                                }
                            ]
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
                        "distributor": bestStock.distributors || {}
                    }
                    return {
                        PId: product.PId,
                        PName: product.PName,
                        PackagingDetails: product.PackagingDetails,
                        SaltComposition: product.SaltComposition,
                        bestStock: sss
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
            const { retailerId, profilePic, firmName, companyType, ownerName, email, phone, address, GST, FSSAI, PAN, CIN, businessAdd, billingAdd, documents, distributors } = data;

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
                userId: Number(retailerId)
            }));

            await db.documents.bulkCreate(documentsData, {
                updateOnDuplicate: ["image", "status", 'imageSize'],
                conflictFields: ["categoryId", "userId"],
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
                        attributes: ['documentId','image', "status", "imageSize", 'updatedAt'],
                        where: {
                            userId: Number(id)
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

            const documentColumns = columns.length > 0 ? columns.map(col => `doc.\`${col}\``).join(", ") : '';

            const documentColumnsQuery = documentColumns ? `, ${documentColumns}` : '';

            const query = `
            SELECT 
            mn.retailerId,
              mn.firmName, 
        mn.ownerName, 
        mn.profilePic, 
        mn.createdAt, 
        mn.updatedAt, 
        mn.address, 
        mn.phone, 
        mn.email, 
        mn.GST as gst, 
        mn.retailerId,
        mn.FSSAI,
        mn.drugLicense,
        mn.companyType,
        mn.PAN as pan, 
        mn.CIN as cin,
              us.*, 
              ad.*
            FROM crm_db.retailers AS mn
            LEFT JOIN crm_db.users AS us 
              ON mn.retailerId = us.id
            LEFT JOIN crm_db.address AS ad
              ON mn.retailerId = ad.userId
            WHERE mn.retailerId = ${id};
          `;

            const [dataa] = await db.sequelize.query(query);
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
            // console.log(dataa)
            dataa.forEach((row) => {
                const distributorId = row.distributorId;

                if (!transformedData[distributorId]) {
                    transformedData[distributorId] = {
                        retailer: {
                            retailerId: row.retailerId,
                            companyName: row.firmName,
                            ownerName: row.ownerName,
                            companyType:row.companyType,
                            wholeSaleDrugLicence:row.drugLicense,
                            logo: row.profilePic,
                            createdAt: row.createdAt,
                            updatedAt: row.updatedAt,
                            address: row.address,
                            phone: row.phone,
                            email: row.email,
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
            let whereCondition = { organisationId: Number(distributorId) };
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

            if (search) {
                whereCondition[db.Op.or] = [
                    { BatchNo: { [db.Op.like]: `%${search}%` } },
                    { '$product.PName$': { [db.Op.like]: `%${search}%` } },
                    { '$product.SaltComposition$': { [db.Op.like]: `%${search}%` } }
                ];
            }
            let checkAuth;
            let checkCart;
            if (id) {
                checkAuth = await db.authorizations.findOne({ where: { authorizedId: Number(id), authorizedBy: Number(distributorId) } })
                checkCart = await db.usercarts.findAll({ where: { orderFrom: Number(id), orderTo: Number(distributorId) } })
            }
            // let skip = Page>1?(Page - 1) * Number(Limit):Limit
            console.log(id,"checkCart")
            const userData = await db.users.findOne({
                where: { id: Number(distributorId) },
                attributes: ['id', 'userName'],
                include: [
                    {
                        model: db.distributors,
                        as: 'disuser',
                        // attributes:['distributorId','companyName',"profilePic",''],
                    },
                    {
                        model: db.address,
                        as: 'addresss',
                    }
                ]
            })
            const { rows: stocks, count } = await db.stocks.findAndCountAll({
                // attributes:[]
                where: whereCondition,
                include: [
                    {
                        model: db.products,
                        as: 'product',
                        attributes: ["PId", "PCode", "PName", "PackagingDetails", "SaltComposition", "LOCKED", "manufacturerId"]
                    }
                ],
                offset: skip,
                limit: Limit,
            })
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
                    "PTR": item?.PTR,
                    "PTS": item?.PTS,
                    "Scheme": item?.Scheme,
                    "BoxQty": item?.BoxQty,
                    "Loose": item?.Loose,
                    "Stock": item?.Stock,
                    "organisationId": item?.organisationId,
                    "entityId": item?.entityId,
                    "location": item?.location,
                    "createdAt": item?.createdAt,
                    "updatedAt": item?.updatedAt,
                    "purchasedFrom": item?.purchasedFrom,
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
                totalItem: count,
                totalPage: Math.ceil(count / Limit),
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
                offset: skip,
                limit: Limit,
                order: [["orderDate", "DESC"]]
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

    async po_page_card_data_retailer(data){
        try {
            const { id } = data;
            const userId = Number(id);
            let whereauthApproved = {authorizedId:userId,status:"Approved"}
            let whereauthPending = { authorizedId: userId, status: "Pending" }
            let whereorders={ orderFrom: userId }

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
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN orderStatus IN ('Inward', 'Paid', 'Partial paid') THEN 1 ELSE 0 END")), "completedOrders"], // Completed orders count
                        [db.sequelize.fn("COUNT", db.sequelize.literal("CASE WHEN balance > 0 THEN 1 ELSE NULL END")), "totalDueAmtOrders"], // Count of due amount orders
                        [db.sequelize.fn("SUM", db.sequelize.literal("CASE WHEN balance > 0 THEN balance ELSE 0 END")), "totalDueAmount"] // Sum of due amounts
                    ],
                    where: whereorders,
                    raw: true,
                }),

                // Fetch total retailers grouped by companyType
                db.authorizations.count({where:whereauthApproved}),

                // Count pending authorizations
                db.authorizations.count({ where:whereauthPending  }),
            ]);


            // Extract retailer counts based on companyType
            // const totalRetailersCount = retailerCounts.length > 0 ? Number(retailerCounts[0]?.totalRetailers) || 0 : 0;

            return {
                status: 200,
                message: "Data fetched successfully",
                data: {
                    totalOrders: Number(orderStats?.totalOrders) || 0,
                    completedOrders: Number(orderStats?.completedOrders) || 0,
                    pendingOrders: (Number(orderStats?.totalOrders) || 0) - (Number(orderStats?.completedOrders) || 0),
                    totalDueAmtOrders: orderStats?.totalDueAmtOrders ? Number(orderStats.totalDueAmtOrders.toFixed(2)) : 0.0,
                    totalDueAmount: orderStats?.totalDueAmount ? Number(orderStats.totalDueAmount.toFixed(2)) : 0.0,
                    distributors: distributors,
                    pendingAuthorizations,
                },
            };
        } catch (error) {
            console.log('po_page_card_data_retailer error:',error.message)
            return {
                status:message.code500,
                message:message.message500
            }
        }
    }
}
module.exports = new RetailerService(db);