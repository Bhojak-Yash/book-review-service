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
              }
            }
            transaction = await db.sequelize.transaction();
        
            const hashedPassword = await hashPassword(password);
    
            const user = await Users.create(
                {
                  userName: userName,
                  password: hashedPassword,
                  userType: 'Retailer',
                  status:"Active"
                },
                { transaction }
              );
          
    
            await Retailers.create(
                {
                    retailerId: user.id, // Assuming `id` is the primary key of the `users` table
                    firmName: companyName,
                },
                { transaction }
                );
                 // Commit the transaction
                await transaction.commit();
        
                return {
                    status:message.code200,
                    message:message.message200
                }
        } catch (error) {
            if (transaction) await transaction.rollback();
            console.log('createRetailer error:',error.message)
           return {
                status:message.code500,
                message:message.message500
            }
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

    // async retailer_profile_update(req) {
    //     let transaction;
    //     try {
    //         const userId = req.user?.id;
    //         if (!userId) {
    //             return { status: 400, message: "User ID is required" };
    //         }

    //         const { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic, businessAdd, billingAdd, documents } = req.body;

    //         transaction = await db.sequelize.transaction({ timeout: 30000 });

    //         // Check if retailer exists
    //         const retailer = await db.retailers.findOne({ where: { retailerId: userId }, transaction });

    //         if (!retailer) {
    //             await db.retailers.create({ retailerId: userId, ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic }, { transaction });
    //         } else {
    //             await db.retailers.update({ ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic }, { where: { retailerId: userId }, transaction });
    //         }

    //         // Address Handling
    //         await Promise.all([
    //             db.address.upsert({ ...businessAdd, userId, addressType: "Business" }, { transaction }),
    //             db.address.upsert({ ...billingAdd, userId, addressType: "Billing" }, { transaction })
    //         ]);

    //         // ✅ **Validate document category before inserting documents**
    //         const validCategories = await db.documentCategory.findAll({
    //             attributes: ['id', 'category'],
    //             where: { category: "Retailer" },
    //             raw: true,
    //             transaction
    //         });

    //         const validCategoryIds = validCategories.map(cat => cat.id); // Extract valid category IDs

    //         const documentMapping = {
    //             PAN: documents.PAN,
    //             GST: documents.GST,
    //             CIN: documents.CIN,
    //             drugLicense: documents.drugLicense,
    //             ISO: documents.ISO
    //         };

    //         const documentsData = [];

    //         for (const [categoryName, image] of Object.entries(documentMapping)) {
    //             if (image) {
    //                 const category = validCategories.find(cat => cat.category === "Retailer" && cat.id);

    //                 if (category) {
    //                     documentsData.push({
    //                         categoryId: category.id, // Use valid categoryId
    //                         image,
    //                         status: 'Verified',
    //                         userId
    //                     });
    //                 }
    //             }
    //         }

    //         if (documentsData.length > 0) {
    //             await db.documents.bulkCreate(documentsData, {
    //                 updateOnDuplicate: ["image", "status"],
    //                 transaction
    //             });
    //         }

    //         await transaction.commit();
    //         return { status: 200, message: "Retailer details updated successfully" };
    //     } catch (error) {
    //         console.log('retailer_profile_update service error:', error.message);
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

            const { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic, businessAdd, billingAdd, documents } = req.body;

            transaction = await db.sequelize.transaction({ timeout: 30000 });

            // ✅ Check if retailer exists
            const retailer = await db.retailers.findOne({ where: { retailerId: userId }, transaction });

            if (!retailer) {
                await db.retailers.create(
                    { retailerId: userId, ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic },
                    { transaction }
                );
            } else {
                await db.retailers.update(
                    { ownerName, firmName, companyType, phone, email, PAN, GST, CIN, drugLicense, FSSAI, profilePic },
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
                { name: "drugLicense", image: documents?.drugLicense },
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
