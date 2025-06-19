const db = require('../models/db');
const { Op } = db.Sequelize;
const message = require('../helpers/message');
const sequelize = require('sequelize');

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

// exports.create_Hospital = async (hospitalData) => {
//     const transaction = await db.sequelize.transaction();

//     try {
//         let { hospitalName, email } = hospitalData;

//         if (!hospitalName || !email) {
//             throw { status: 400, message: "hospitalName and email are required." };
//         }

//         const existingUser = await db.users.findOne({
//             where: { userName: email },
//             transaction
//         });

//         if (existingUser) {
//             await transaction.rollback();
//             return {
//                 status: 400,
//                 message: 'A hospital with this email already exists.',
//             };
//         }

//         // Create user
//         const defaultPassword = Math.random().toString(36).slice(-8);
//         const hashedPassword = await bcrypt.hash(defaultPassword, 10);
//         let status = email ? "Active" : "Inactive";

//         email = email.toLowerCase();
//         hospitalData.email = email;

//         const newUser = await db.users.create({
//             userName: email,
//             password: hashedPassword,
//             userType: "Hospital",
//             status
//         }, { transaction });

//         const hospitalCode = `H-${newUser.id}`;

//         const newHospital = await db.hospital.create({
//             ...hospitalData, 
//             hospitalId: newUser.id,
//             hospitalCode,
//             status,
//         }, { transaction });

//         // Send email
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });

//         const mailOptions = {
//             from: process.env.EMAIL,
//             to: email,
//             subject: 'Hospital Account Details',
//             text: `Your hospital account has been successfully created.\n\nYour email: ${email}\nYour password: ${defaultPassword}\n\nLogin Link: ${process.env.login_hospital}`
//         };

//         try {
//             await transporter.sendMail(mailOptions);
//             console.log("Email sent successfully!");
//         } catch (emailError) {
//             console.error("Email sending failed:", emailError);
//         }

//         // Commit the transaction
//         await transaction.commit();

//         // Return the created hospital
//         const updatedHospital = await db.hospital.findByPk(newHospital.hospitalId);
//         return {
//             status: 200,
//             message: "Hospital created successfully",
//             updatedHospital
//         }
//     } catch (error) {
//         if (transaction) await transaction.rollback();
//         console.error("Error in create_Hospital service:", error);
//         throw error;
//     }
// };


exports.get_Hospital = async ({ page = 1, limit, hospitalName, status, startDate, endDate }) => {
    try {
        limit = parseInt(limit) || 10;
        const offset = (page - 1) * limit;

        let whereClause = {};

        if (hospitalName && hospitalName.trim().length >= 3) {
            whereClause.hospitalName = { [Op.like]: `%${hospitalName}%` };
        }

        if (status && ["Active", "Inactive"].includes(status)) {
            whereClause.status = status;
        }

        if (startDate && endDate) {
            const adjustedStartDate = new Date(startDate);
            const adjustedEndDate = new Date(endDate);
            adjustedStartDate.setUTCHours(0, 0, 0, 0);
            adjustedEndDate.setUTCHours(23, 59, 59, 999);

            whereClause.createdAt = {
                [Op.between]: [adjustedStartDate, adjustedEndDate]
            };
        }

        const totalHospitals = await db.hospital.count({ where: whereClause });

        const hospitals = await db.hospital.findAll({
            where: whereClause,
            attributes: [
                'hospitalId',
                'hospitalCode',
                'hospitalName',
                'type',
                'phone',
                'email',
                'address',
                'city',
                'state',
                'GST',
                'license',
                'status',
                'createdAt',
                'updatedAt'
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        if (!hospitals.length) {
            return {
                status: 400,
                message: "No hospitals found."
            };
        }

        return {
            status: 200,
            message: "Hospitals retrieved successfully",
            totalHospitals,
            totalPages: Math.ceil(totalHospitals / limit),
            currentPage: Number(page),
            data: hospitals 
        };

    } catch (error) {
        console.error("Error in get_Hospital:", error);
        return {
            status: 500,
            message: "Failed to fetch hospitals",
            error: error.message || "Internal Server Error"
        };
    }
};
// exports.get_Hospital = async ({ page = 1, limit, hospitalName, status, startDate, endDate }) => {
//     try {
//         limit = parseInt(limit) || 10;
//         const offset = (page - 1) * limit;

//         let whereClause = {};

//         if (hospitalName && hospitalName.trim().length >= 3) {
//             whereClause.hospitalName = { [Op.like]: `%${hospitalName}%` };
//         }

//         if (status && ["Active", "Inactive"].includes(status)) {
//             whereClause.status = status;
//         }

//         if (startDate && endDate) {
//             const adjustedStartDate = new Date(startDate);
//             const adjustedEndDate = new Date(endDate);
//             adjustedStartDate.setUTCHours(0, 0, 0, 0);
//             adjustedEndDate.setUTCHours(23, 59, 59, 999);

//             whereClause.createdAt = {
//                 [Op.between]: [adjustedStartDate, adjustedEndDate]
//             };
//         }

//         const totalHospitals = await db.hospital.count({ where: whereClause });

//         const hospitals = await db.hospital.findAll({
//             where: whereClause,
//             attributes: [
//                 'hospitalId',
//                 'hospitalCode',
//                 'hospitalName',
//                 'type',
//                 'phone',
//                 'email',
//                 'address',
//                 'city',
//                 'state',
//                 'GST',
//                 'license',
//                 'status',
//                 'createdAt',
//                 'updatedAt'
//             ],
//             limit,
//             offset,
//             order: [['createdAt', 'DESC']]
//         });

//         if (!hospitals.length) {
//             return {
//                 status: 400,
//                 message: "No hospitals found."
//             };
//         }

//         const formattedHospitals = await Promise.all(hospitals.map(async hospital => {
//             const hospitalId = hospital.hospitalId;

//             const addresses = await db.address.findAll({
//                 where: { userId: hospitalId },
//                 raw: true
//             });

//             const businessAddress = addresses.find(a => a.addressType === 'Business') || null;
//             const billingAddress = addresses.find(a => a.addressType === 'Billing') || null;

//             const documentData = await db.documentCategory.findAll({
//                 attributes: ['id', 'documentName'],
//                 where: { category: 'Hospital' },
//                 include: [
//                     {
//                         model: db.documents,
//                         as: 'documnets',
//                         attributes: ['documentId', 'image', 'status', 'imageSize', 'updatedAt'],
//                         where: {
//                             isDeleted: { [Op.not]: true },
//                             userId: hospitalId
//                         },
//                         required: false
//                     }
//                 ]
//             });

//             return {
//                 hospitalId: hospital.hospitalId,
//                 hospitalCode: hospital.hospitalCode,
//                 hospitalName: hospital.hospitalName,
//                 type: hospital.type,
//                 phone: hospital.phone,
//                 email: hospital.email,
//                 address: hospital.address,
//                 city: hospital.city,
//                 state: hospital.state,
//                 GST: hospital.GST,
//                 license: hospital.license,
//                 status: hospital.status,
//                 createdAt: hospital.createdAt,
//                 updatedAt: hospital.updatedAt,
//                 businessAddress,
//                 billingAddress,
//                 documents: documentData
//             };
//         }));

//         return {
//             status: 200,
//             message: "Hospitals retrieved successfully",
//             totalHospitals,
//             totalPages: Math.ceil(totalHospitals / limit),
//             currentPage: Number(page),
//             data: {
//                 formattedHospitals
//             }
//         };

//     } catch (error) {
//         console.error("Error in get_Hospital:", error);
//         return {
//             status: 500,
//             message: "Failed to fetch hospitals",
//             error: error.message || "Internal Server Error"
//         };
//     }
// };


exports.get_HospitalById = async ({ hospitalId }) => {
    try {
        if (!hospitalId) {
            return {
                status: 400,
                message: "hospitalId is required."
            };
        }

        const hospital = await db.hospital.findOne({
            where: { hospitalId }
        });

        if (!hospital) {
            return {
                status: 404,
                message: "Hospital not found."
            };
        }

        return {
            status: 200,
            message: "Hospital retrieved successfully",
            data: hospital
        };

    } catch (error) {
        console.error("Error in get_HospitalById:", error);
        return {
            status: 500,
            message: "Failed to fetch hospital",
            error: error.message || "Internal Server Error"
        };
    }
};

exports.update_Hospital = async (hospitalId, updateData) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (!hospitalId) {
            return { status: 400, message: "hospitalId is required in query" };
        }

        const hospital = await db.hospital.findOne({ where: { hospitalId } });

        if (!hospital) {
            return { status: 400, message: "Hospital not found" };
        }

        const hospitalFields = {
            hospitalName: updateData.hospitalName,
            type: updateData.type,
            phone: updateData.phone,
            email: updateData.email,
            address: updateData.address,
            city: updateData.city,
            state: updateData.state,
            GST: updateData.GST,
            license: updateData.license,
            status: updateData.status,
        };

        await db.hospital.update(hospitalFields, {
            where: { hospitalId },
            transaction
        });

        // ---------------- Address Handling ----------------
        const distributorId = hospitalId;
        const businessAdd = updateData.businessAdd;
        const billingAdd = updateData.billingAdd;

        const existingAddresses = await db.address.findAll({
            where: { userId: distributorId },
            transaction
        });

        const existingBusiness = existingAddresses.find(addr => addr.addressType === "Business");
        const existingBilling = existingAddresses.find(addr => addr.addressType === "Billing");

        if (existingBusiness) {
            await existingBusiness.update(businessAdd, { transaction });
        } else {
            await db.address.create({
                ...businessAdd,
                userId: distributorId,
                addressType: "Business"
            }, { transaction });
        }

        if (existingBilling) {
            await existingBilling.update(billingAdd, { transaction });
        } else {
            await db.address.create({
                ...billingAdd,
                userId: distributorId,
                addressType: "Billing"
            }, { transaction });
        }

        // ---------------- Document Handling ----------------
        const documents = updateData.documents || [];
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
            conflictFields: ["categoryId", "userId", 'isDeleted'],
            transaction
        });

        await transaction.commit();

        const updatedHospital = await db.hospital.findOne({
            where: { hospitalId },
            attributes: [
                'hospitalName',
                'type',
                'phone',
                'email',
                'address',
                'city',
                'state',
                'GST',
                'license',
                'status',
            ]
        });

        return {
            status: 200,
            message: "Hospital updated successfully",
            updatedHospital,
            billingAdd,
            businessAdd,
            documents: documentsData
        };

    } catch (error) {
        await transaction.rollback();
        console.error("Error in update_Hospital:", error);
        return {
            status: 500,
            message: "Failed to update hospital",
            error: error.message || "Internal Server Error"
        };
    }
};

//get Profile and get by hospitalId
exports.getHospitalProfile = async (data, queryData) => {
    try {
        let hospitalId = data?.id;

        console.log(hospitalId);

        if(queryData.hospitalId){
            hospitalId = queryData.hospitalId;
        }

        console.log(hospitalId);

        // Handle employee type users
        if (data?.userType === "Employee") {
            hospitalId = data?.data?.employeeOf;
        }

        if (!hospitalId) {
            return {
                status: 400,
                message: "Hospital ID is required"
            };
        }

        // Fetch hospital data
        const hospital = await db.hospital.findOne({
            where: { hospitalId: hospitalId },
            order: [['createdAt', 'DESC']]
        });

        if (!hospital) {
            return {
                status: 400,
                message: "No hospital found."
            };
        }

        // Fetch addresses (Business & Billing)
        const addresses = await db.address.findAll({
            where: { userId: hospitalId },
            raw: true
        });

        const businessAddress = addresses.find(a => a.addressType === 'Business') || null;
        const billingAddress = addresses.find(a => a.addressType === 'Billing') || null;

        // Fetch documents
        const documentData = await db.documentCategory.findAll({
            attributes: ['id', 'documentName'],
            where: { category: 'Hospital' },
            include: [
                {
                    model: db.documents,
                    as: 'documnets',
                    attributes: ['documentId', 'image', 'status', 'imageSize', 'updatedAt'],
                    where: {
                        isDeleted: { [db.Sequelize.Op.not]: true },
                        userId: hospitalId
                    },
                    required: false
                }
            ]
        });

        return {
            status: 200,
            message: "Hospital retrieved successfully",
            data: {
                hospitalId: hospital.hospitalId,
                hospitalCode: hospital.hospitalCode,
                hospitalName: hospital.hospitalName,
                type: hospital.type,
                phone: hospital.phone,
                email: hospital.email,
                address: hospital.address,
                city: hospital.city,
                state: hospital.state,
                GST: hospital.GST,
                license: hospital.license,
                status: hospital.status,
                createdAt: hospital.createdAt,
                updatedAt: hospital.updatedAt,
                businessAddress,
                billingAddress,
                documents: documentData
            }
        };

    } catch (error) {
        console.error("Error in getHospitalProfile:", error);
        return {
            status: 500,
            message: "Failed to fetch hospital",
            error: error.message || "Internal Server Error"
        };
    }
};

