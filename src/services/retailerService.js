const message = require('../helpers/message');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const Users = db.users;
const Retailers = db.retailers;
const Op= db.Op


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
                message: message.message500,
            };
        }

    }

    async get_distributors_list(data) {
        try {
            const {search} = data
            let whereClause = {userType: ['distributor', 'cnfs']}
            if(search){
                whereClause.userName = { [Op.like]: `%${search}%` }
            }
            const Data = await db.users.findAll({
                attributes:['id','userName'],
                where:whereClause,
                include:[
                    {
                        model:db.distributors,
                        as:'disuser',
                        attributes:['companyName'],
                        required:true
                    }
                ]
            })
            const result = Data?.map((item)=>{
                return {
                    id:item.id,
                    userName:item?.disuser[0]?.companyName || item.userName
                }
            })
            return {
                status:message.code200,
                message:message.message200,
                apiData:result
            }
        } catch (error) {
            console.log('get_distributors_list service error:',error.message)
            throw new Error(error.message);
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

    async retailer_profile_update(data){
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
                userId: Number(retailerId)
            }));

            await db.documents.bulkCreate(documentsData, {
                updateOnDuplicate: ["image", "status"],
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
            console.log('retailer_profile_update service error:',error.message)
            return {
                status:message.code500,
                message:error.message
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
                        attributes: ['image', "status", 'updatedAt'],
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
            const authorizedBy=await db.authorizations.findAll({
                where:{authorizedId:Number(id)},
                attributes:['authorizedId','authorizedBy'],
                include:[
                    {
                        model:db.distributors,
                        as:"distributor",
                        attributes:['distributorId','companyName','type'],
                        required:true
                    }
                ]
            })
            const auth = authorizedBy?.map((item)=>{
                return {
                    authorizedBy:item.authorizedBy,
                    authorizedByUser:item?.distributor?.companyName || null,
                    type:item?.distributor?.type
                }
            })
            // console.log(dataa)
            dataa.forEach((row) => {
                const distributorId = row.distributorId;

                if (!transformedData[distributorId]) {
                    transformedData[distributorId] = {
                        retailer: {
                            companyName: row.firmName,
                            ownerName: row.ownerName,
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
                transformedData[distributorId].authorizedBy=auth
            });
            
          
            const result = Object.values(transformedData);
            return {
                status: message.code200,
                message: message.message200,
                apiData: result[0]
            }
        } catch (error) {
            console.log('retailer_profile_get service error:',error.message)
            return {
                status:message.code500,
                message:error.message
            }
        }
    }
}
module.exports = new RetailerService(db);
