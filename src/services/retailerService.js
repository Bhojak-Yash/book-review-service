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

    // async createRetailers(data) {
    //     let transaction;
    //     try {
    //         const { userName, password, companyName } = data;
        
    //         if (!userName || !password || !companyName) {
    //           return {
    //             status: message.code400,
    //             message: "All fields are required",
    //           }
    //         }
    //         transaction = await db.sequelize.transaction();
        
    //         const hashedPassword = await hashPassword(password);
    
    //         const user = await Users.create(
    //             {
    //               userName: userName,
    //               password: hashedPassword,
    //               userType: 'Retailer',
    //               status:"Active"
    //             },
    //             { transaction }
    //           );
          
    
    //         await Retailers.create(
    //             {
    //                 retailerId: user.id, // Assuming `id` is the primary key of the `users` table
    //                 firmName: companyName,
    //             },
    //             { transaction }
    //             );
    //              // Commit the transaction
    //             await transaction.commit();
        
    //             return {
    //                 status:message.code200,
    //                 message:message.message200
    //             }
    //     } catch (error) {
    //         if (transaction) await transaction.rollback();
    //         console.log('createRetailer error:',error.message)
    //        return {
    //             status:message.code500,
    //             message:message.message500
    //         }
    //     }

    // }

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
            const Data = await db.users.findAll({attributes:['id','userName'],where:whereClause})
            return {
                status:message.code200,
                message:message.message200,
                apiData:Data
            }
        } catch (error) {
            console.log('get_distributors_list service error:',error.message)
            throw new Error(error.message);
        }
    }

    // async retailer_profile_update(data) {
    //     let transaction;
    //     try {
    //         const { userId, search } = data;
    //         if (!userId) {
    //             return { status: 400, message: "User ID is required" };
    //         }

    //         transaction = await db.sequelize.transaction({ timeout: 30000 });

    //         // ✅ Check if retailer exists
    //         let whereClause = { retailerId: userId };
    //         const retailer = await db.retailers.findOne({ where: whereClause, transaction });

    //         const retailerData = {
    //             retailerId: userId,
    //             ownerName: data.ownerName,
    //             firmName: data.firmName,
    //             companyType: data.companyType,
    //             phone: data.phone,
    //             email: data.email,
    //             PAN: data.PAN,
    //             GST: data.GST,
    //             CIN: data.CIN,
    //             DrugLicense: data.DrugLicense,
    //             FSSAI: data.FSSAI,
    //             profilePic: data.profilePic
    //         };

    //         if (!retailer) {
    //             await db.retailers.create(retailerData, { transaction });
    //         } else {
    //             await db.retailers.update(retailerData, { where: whereClause, transaction });
    //         }

    //         // ✅ Address Handling
    //         const addressTypes = [
    //             { data: data.businessAdd, type: "Business" },
    //             { data: data.billingAdd, type: "Billing" }
    //         ];

    //         for (const addr of addressTypes) {
    //             if (addr.data) {
    //                 let addressWhere = { userId, addressType: addr.type };
    //                 const existingAddress = await db.address.findOne({ where: addressWhere, transaction });
    //                 if (existingAddress) {
    //                     await db.address.update(addr.data, { where: addressWhere, transaction });
    //                 } else {
    //                     await db.address.create({ ...addr.data, userId, addressType: addr.type }, { transaction });
    //                 }
    //             }
    //         }

    //         // ✅ Fetch document categories for Retailer
    //         let docWhereClause = { category: "Retailer" };
    //         const documentCategories = await db.documentCategory.findAll({
    //             attributes: ['id', 'documentName'],
    //             where: docWhereClause,
    //             raw: true,
    //             transaction
    //         });

    //         let categoryMap = {};
    //         documentCategories.forEach(doc => {
    //             categoryMap[doc.documentName] = doc.id;
    //         });

    //         // ✅ Document Handling
    //         const documentMapping = [
    //             { name: "PAN", image: data.documents?.PAN },
    //             { name: "GST", image: data.documents?.GST },
    //             { name: "CIN", image: data.documents?.CIN },
    //             { name: "DrugLicense", image: data.documents?.DrugLicense },
    //             { name: "ISO", image: data.documents?.ISO }
    //         ];

    //         for (const doc of documentMapping) {
    //             if (doc.image && categoryMap[doc.name]) {
    //                 let docWhere = { userId, categoryId: categoryMap[doc.name] };
    //                 const existingDoc = await db.documents.findOne({ where: docWhere, transaction });
    //                 if (existingDoc) {
    //                     await db.documents.update({ image: doc.image, status: 'Verified' }, { where: docWhere, transaction });
    //                 } else {
    //                     await db.documents.create({ userId, categoryId: categoryMap[doc.name], image: doc.image, status: 'Verified' }, { transaction });
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

    async retailer_profile_update(req) {
        let transaction;
        try {
            const userId = req.user?.id;
            if (!userId) {
                return { status: 400, message: "User ID is required" };
            }

            const { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic, businessAdd, billingAdd, documents } = req.body;

            transaction = await db.sequelize.transaction({ timeout: 30000 });

            // ✅ Check if retailer exists
            const retailer = await db.retailers.findOne({ where: { retailerId: userId }, transaction });

            if (!retailer) {
                await db.retailers.create(
                    { retailerId: userId, ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic },
                    { transaction }
                );
            } else {
                await db.retailers.update(
                    { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, DrugLicense, FSSAI, profilePic },
                    { where: { retailerId: userId }, transaction }
                );
            }

            // ✅ Address Handling (Ensuring Update Instead of Insert)
            const addressTypes = [
                { data: businessAdd, type: "Business" },
                { data: billingAdd, type: "Billing" }
            ];

            for (const addr of addressTypes) {
                if (addr.data) {
                    const existingAddress = await db.address.findOne({
                        where: { userId, addressType: addr.type },
                        transaction
                    });

                    if (existingAddress) {
                        await db.address.update(
                            { ...addr.data },
                            { where: { userId, addressType: addr.type }, transaction }
                        );
                        console.log(`Updated ${addr.type} Address`);
                    } else {
                        await db.address.create(
                            { ...addr.data, userId, addressType: addr.type },
                            { transaction }
                        );
                        console.log(`Inserted ${addr.type} Address`);
                    }
                }
            }

            // ✅ Fetch document categories for Retailer
            const documentCategories = await db.documentCategory.findAll({
                attributes: ['id', 'documentName'],
                where: { category: "Retailer" },
                raw: true,
                transaction
            });

            // ✅ Create a mapping of document names to category IDs
            const categoryMap = {};
            documentCategories.forEach(doc => {
                categoryMap[doc.documentName] = doc.id;
            });

            console.log("Document Categories:", categoryMap);

            // ✅ Document Handling (Ensure each document gets correctly updated)
            const documentMapping = [
                { name: "PAN", image: documents?.PAN },
                { name: "GST", image: documents?.GST },
                { name: "CIN", image: documents?.CIN },
                { name: "DrugLicense", image: documents?.DrugLicense },
                { name: "ISO", image: documents?.ISO }
            ];

            for (const doc of documentMapping) {
                if (doc.image && categoryMap[doc.name]) {
                    const categoryId = categoryMap[doc.name]; // Get categoryId using document name

                    const existingDoc = await db.documents.findOne({
                        where: { userId, categoryId },
                        transaction
                    });

                    if (existingDoc) {
                        await db.documents.update(
                            { image: doc.image, status: 'Verified' },
                            { where: { userId, categoryId }, transaction }
                        );
                        console.log(`Updated ${doc.name}: ${doc.image}`);
                    } else {
                        await db.documents.create(
                            { userId, categoryId, image: doc.image, status: 'Verified' },
                            { transaction }
                        );
                        console.log(`Inserted ${doc.name}: ${doc.image}`);
                    }
                }
            }

            await transaction.commit();
            return { status: 200, message: "Retailer details updated successfully" };
        } catch (error) {
            console.error('retailer_profile_update service error:', error.message);
            if (transaction) await transaction.rollback();
            return { status: 500, message: "Internal Server Error" };
        }
    }
}
module.exports = new RetailerService(db);
